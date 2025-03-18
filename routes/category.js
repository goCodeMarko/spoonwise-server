"use_strict";

const { execute } = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename, ".js"),
  express = require("express"),
  router = express.Router(),
  controller = require(`../controllers/${base}`);

// router.post(
//   `/api/${base}/createTransaction`,
//   execute(controller.createTransaction, {
//     secured: true,
//     role: ["admin"],
//     strict: { isallowedtocreate: true },
//   })
// ); 

router.get(
  `/api/${base}/getCategories`,
  execute(controller.getCategories, {
    secured: true,
    role: ["buyer", "admin"],
  })
); //---------done

module.exports = router;
