"use_strict";

const { execute } = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename, ".js"),
  express = require("express"),
  router = express.Router(),
  multer = require('./../services/multer')
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
  `/api/${base}/getProducts`,
  execute(controller.getProducts, {
    secured: true,
    role: ["buyer", "admin", "seller"],
  })
); //---------done

router.get(
  `/api/${base}/getProduct/:id`,
  execute(controller.getProduct, {
    secured: true,
    role: ["buyer", "admin", "seller"],
  })
); //---------done

router.post(
  `/api/${base}/createProduct`, multer.array('prod_pictures'),
  execute(controller.createProduct, {
    secured: true,
    role: ["seller"],
  })
); //---------done

module.exports = router;
