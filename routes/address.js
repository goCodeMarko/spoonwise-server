"use_strict";

const { execute } = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    express = require("express"),
    router = express.Router(),
    controller = require(`../controllers/${base}`);

router.get(
    `/api/${base}/regions`,
    execute(controller.regions, {
        secured: true,
        role: ["buyer", "seller", "admin"],
    })
);

router.get(
    `/api/${base}/provinces/`,
    execute(controller.provinces, {
        secured: true,
        role: ["buyer", "seller", "admin"],
    })
);

router.get(
    `/api/${base}/municipalities/:psgcCode`,
    execute(controller.municipalities, {
        secured: true,
        role: ["buyer", "seller", "admin"],
    })
);

router.get(
    `/api/${base}/barangays/:psgcCode`,
    execute(controller.barangays, {
        secured: true,
        role: ["buyer", "seller", "admin"],
    })
);



module.exports = router;
