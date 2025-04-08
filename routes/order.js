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

router.get(
  `/api/${base}/getOrders/:status`,
  execute(controller.getOrders, {
    secured: true,
    role: ["buyer"],
    strict: { isallowedtocreate: true },
  })
); //---------done

router.get(
  `/api/${base}/lalamove/getQuotation`,
  execute(controller.lalamoveGetQuotation, {
    secured: true,
    role: ["buyer"],
    strict: { isallowedtocreate: true },
  })
); //---------done

router.post(
  `/api/${base}/lalamove/createOrder`,
  execute(controller.lalamoveCreateOrder, {
    secured: true,
    role: ["buyer"],
    strict: { isallowedtocreate: true },
  })
); //---------done

router.post(
  `/api/${base}/webhook/lalamove`,
  execute(controller.webhookLalamove, {
    secured: false
  })
);

router.get(
  `/api/${base}/getOrder`,
  execute(controller.getOrder, {
    secured: true,
    role: ["buyer"],
    strict: { isallowedtocreate: true },
  })
);

router.put(
  `/api/${base}/updateOrderStatus`,
  execute(controller.updateOrderStatus, {
    secured: true,
    role: ["buyer"],
    strict: { isallowedtocreate: true },
  })
);

router.put(
  `/api/${base}/updateOrderLineItemStatus`,
  execute(controller.updateOrderLineItemStatus, {
    secured: true,
    role: ["buyer"],
    strict: { isallowedtocreate: true },
  })
);

router.put(
  `/api/${base}/lalamove/stopFindingDrivers`,
  execute(controller.lalamoveStopFindingDrivers, {
    secured: true,
    role: ["buyer"],
    strict: { isallowedtocreate: true },
  })
);

router.put(
  `/api/${base}/updateStoreReviews`,
  execute(controller.updateStoreReviews, {
    secured: true,
    role: ["buyer"],
    strict: { isallowedtocreate: true },
  })
);

router.get(
  `/api/${base}/getShopReviews/:shopId`,
  execute(controller.getShopReviews, {
    secured: true,
    role: ["buyer", "seller"],
    strict: { isallowedtocreate: true },
  })
);


module.exports = router;
