"use_strict";

const { execute } = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename, ".js"),
  express = require("express"),
  router = express.Router(),
  multer = require('./../services/multer'),
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
  `/api/${base}/getShops`,
  execute(controller.getShops, {
    secured: true,
    role: ["buyer", "admin", "seller"],
  })
); //---------done

router.get(
  `/api/${base}/getShop`,
  execute(controller.getShop, {
    secured: true,
    role: ["seller"],
  })
); //---------done

router.get(
  `/api/${base}/getNearestShops`,
  execute(controller.getNearestShops, {
    secured: true,
    role: ["buyer", "seller"],
  })
); //---------done

router.get(
  `/api/${base}/getShopList`,
  execute(controller.getShopList, {
    secured: true,
    role: ["buyer", "admin"],
  })
); //---------done

router.get(
  `/api/${base}/getShop/:shopId`,
  execute(controller.getShop, {
    secured: true,
    role: ["buyer", "admin", "seller"],
  })
); //---------done

router.put(
  `/api/${base}/saveAsDraftTab1`, multer.fields([
    { name: 'bir', maxCount: 1 },
    { name: 'businessLogo', maxCount: 1 },
    { name: 'validID', maxCount: 1 },
    { name: 'businessPermit', maxCount: 1 },
    { name: 'ownerSelfie', maxCount: 1 },
  ]),
  execute(controller.saveAsDraftTab1, {
    secured: true,
    role: ["seller"],
  })
)

router.put(
  `/api/${base}/saveAsDraftTab2`,
  execute(controller.saveAsDraftTab2, {
    secured: true,
    role: ["seller"],
  })
)

router.put(
  `/api/${base}/saveAsDraftTab3`,
  execute(controller.saveAsDraftTab3, {
    secured: true,
    role: ["seller"],
  })
)

router.put(
  `/api/${base}/sendApplication`,
  execute(controller.sendApplication, {
    secured: true,
    role: ["seller"],
  })
)

router.put(
  `/api/${base}/declineApplication`,
  execute(controller.declineApplication, {
    secured: true,
    role: ["admin"],
  })
)

router.put(
  `/api/${base}/approveApplication`,
  execute(controller.approveApplication, {
    secured: true,
    role: ["admin"],
  })
)

module.exports = router;
