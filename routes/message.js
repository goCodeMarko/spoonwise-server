"use_strict";

const { execute } = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    express = require("express"),
    router = express.Router(),
    controller = require(`../controllers/${base}`);



router.get(
    `/api/${base}/getPastMessages/:chatroomId`,
    execute(controller.getPastMessages, {
        secured: true,
        role: ["buyer", "seller"],
    })
);

router.get(
    `/api/${base}/totalCountSentMessages`,
    execute(controller.totalCountSentMessages, {
        secured: true,
        role: ["buyer", "seller"],
    })
);

router.post(
    `/api/${base}/sendMessage/:chatroomId`,
    execute(controller.sendMessage, {
        secured: true,
        role: ["buyer", "seller"],
    })
);

router.put(
    `/api/${base}/updateChatroomsMsgStatusToDelivered`,
    execute(controller.updateChatroomsMsgStatusToDelivered, {
        secured: true,
        role: ["buyer", "seller"],
    })
);

router.put(
    `/api/${base}/updateChatroomsMsgStatusToSeen/:chatroomId`,
    execute(controller.updateChatroomsMsgStatusToSeen, {
        secured: true,
        role: ["buyer", "seller"],
    })
);


module.exports = router;
