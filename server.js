"use_strict";

(async () => {
  const express = require("express"),
    morgan = require("morgan"),
    cors = require("cors"),
    { Init, requestLogger } = require("./services/padayon"),
    routes = require("./routes"),
    app = express(),
    config = require("./config"),
    server = require("http").createServer(app),
    cookieParser = require("cookie-parser"),
    bodyParser = require("body-parser"),
    hbs = require("handlebars"),
    passportSetup = require("./services/passport"),
    moment = require('moment'),
    webpush = require('web-push'),
    // Redis = require("ioredis"),
    // redis = new Redis({
    //   port: 6379, // Redis port
    //   host: "127.0.0.1", // Redis host,
    // }),
    title = `
    ██████╗ ██████╗  ██████╗      ██╗███████╗ ██████╗████████╗    ███████╗██╗     ██╗      █████╗ 
    ██╔══██╗██╔══██╗██╔═══██╗     ██║██╔════╝██╔════╝╚══██╔══╝    ██╔════╝██║     ██║     ██╔══██╗
    ██████╔╝██████╔╝██║   ██║     ██║█████╗  ██║        ██║       █████╗  ██║     ██║     ███████║
    ██╔═══╝ ██╔══██╗██║   ██║██   ██║██╔══╝  ██║        ██║       ██╔══╝  ██║     ██║     ██╔══██║
    ██║     ██║  ██║╚██████╔╝╚█████╔╝███████╗╚██████╗   ██║       ███████╗███████╗███████╗██║  ██║
    ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚════╝ ╚══════╝ ╚═════╝   ╚═╝       ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝
                                                                                                  
  `;
  // clientFolder =
  //   config.server.type == "local" ? "sandbox-client/client" : "public";

  Init.Mongoose();

  const allowedOrigins = new Set([
    "http://localhost:4888",
    "https://spoonwise.space",
    "https://www.spoonwise.space"
  ]);

  const allowedOriginRegex = /^https:\/\/([a-z0-9-]+\.)*spoonwise\.space(?::\d+)?$/i;
  const localOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/i;

  const enableAppCors = process.env.ENABLE_APP_CORS !== "false";

  const corsOptions = {
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin) || allowedOriginRegex.test(origin) || localOriginRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Timezone", "X-Timezone", "x-timezone", "X-Socket-Id", "x-socket-id"],
  };

  const socketCorsOptions = enableAppCors
    ? corsOptions
    : {
      origin: function (_origin, callback) {
        return callback(null, true);
      },
      credentials: true,
      methods: corsOptions.methods,
      allowedHeaders: corsOptions.allowedHeaders,
    };

  if (process.env.name === 'app-uat-1' || process.env.CLUSTER_MODE === 'NO') {
    // Init.CronJobs();
    console.log('Process Environment: ', process.env)

    const VAPID_PUBLIC_KEY = 'BENFs5s5g4eYPr8DmBtmI7V46TAQhjv22N31JJVVNoicaefJcrM8ezT6XSvt4SUPqk2rt9JfzmuhzTCUr98DPNI';
    const VAPID_PRIVATE_KEY = 'JTeljBhHFTY9leAHY_M1YwQQY51bvnzRhQHi1MLBoAg';

    webpush.setVapidDetails(
      'mailto:patrickmarckdulaca@gmail.com',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    console.log('--------------webpush', webpush)

    module.exports.io = require("socket.io")(server, {
      cors: socketCorsOptions,
    });


    this.io.on("connection", (socket) => {
      const socketId = socket.id;

      const { userId, role, shopId } = socket.handshake.auth;

      if (role == 'seller') {
        socket.join(shopId._id);
        console.log(`A seller shopid ${shopId._id} connected`);
        console.log('---socketId', socketId)
        console.log('---shop._id', shopId._id)
        console.log(socket.handshake.auth);
      } else {
        socket.join(userId);
        console.log(`A buyer id ${userId} connected`);
        console.log('---socketId', socketId)
        console.log(socket.handshake.auth);
      }

      socket.on("disconnect", () => {
        console.log(`A user id ${userId} disconnected`);
      });
    });
  }

  //handlebars custom helpers
  hbs.registerHelper('formatDate', (date, format, timezone) => {
    return moment.utc(date).tz(timezone).format(format);
  });
  hbs.registerHelper('sum', (...numbers) => {
    numbers.pop();
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
  })
  hbs.registerHelper('currency', (cash) => {
    const currency = cash.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' });
    return currency;
  })
  hbs.registerHelper('formatStatus', (status) => {
    let result = '';
    const css = "display: inline-block;padding: 4.2px 7.88px;border-radius: .375rem;font-size: 12px;"
    switch (status) {
      case 1:
        result = `<span style="${css}background-color: #f8f9fa;color: #000000;">Pending</span>`
        break;
      case 2:
        result = `<span style="${css}background-color: #0dcaf0;color: #000000;">Approved</span>`
        break;
      case 3:
        result = `<span style="${css}background-color: #dc3545;color: #ffffff;">Failed</span>`
        break;
      case 4:
        result = `<span style="${css}background-color: #6c757d;color: #ffffff;">Cancelled</span>`
        break;
    }

    return result;
  });

  app
    .use(requestLogger)
    .use(enableAppCors ? require("cors")(corsOptions) : (req, _res, next) => next())
    .options("*", enableAppCors ? require("cors")(corsOptions) : (req, res) => res.sendStatus(204))
    // .use(express.static(path.join(__dirname, clientFolder)))
    .use(bodyParser.json({ limit: "20mb" }))
    .use(bodyParser.urlencoded({ limit: '20mb', extended: true }))
    .use(cookieParser())

    .use(
      morgan(
        " :method :url :status " +
        `pid: ${process.pid}` +
        " :remote-addr - :remote-user [:date[clf]] - :response-time ms"
      )
    )

    .use(routes)


    .get('/', (req, res) => {
      res.send(`<p style="font-style:verdana;">Welcome to GC Portal API!</p></br>
        <pre>powered by \n ${title}</pre>
      `);
    })

    .use((req, res) => {
      const error = Error("API not found");
      res.statusCode = 404;
      res.send({ error: error.message });
    });

  server.listen(config.server.port, () => {
    if (process.env.name === 'app-uat-1' || process.env.CLUSTER_MODE === 'NO') {
      console.log("\x1b[36m", title);
    }
    console.log(
      "\x1b[36m",
      `You're now listening on port http://${config.server.hostname}:${config.server.port}/`
    );
  });
})();
