"use_strict";

const { execute } = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename, ".js"),
  express = require("express"),
  router = express.Router(),
  controller = require(`../controllers/${base}`);

  router.post(
    `/api/${base}/checkout`,
    execute(controller.checkout, {
      secured: true,
      role: ["buyer"],
      strict: { isallowedtocreate: true },
    })
  ); //---------done

  router.post(
    `/api/${base}/webhook/xendit/invoice`,
    execute(controller.webhookXenditInvoice, {
      secured: false
    })
  ); //---------done

module.exports = router;
