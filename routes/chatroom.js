"use_strict";

const { execute } = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    express = require("express"),
    router = express.Router(),
    controller = require(`../controllers/${base}`);

router.get(
    `/api/${base}/getChatrooms`,
    execute(controller.getChatrooms, {
        secured: true,
        role: ["buyer", "seller"],
    })
);

module.exports = router;
