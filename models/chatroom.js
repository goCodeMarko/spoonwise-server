"use_strict";
const padayon = require("../services/padayon"),
    path = require("path"),
    _ = require("lodash"),
    base = path.basename(__filename).split(".").shift(),
    mongoose = require("mongoose");

Chatroom = mongoose.model(
    base,
    mongoose.Schema(
        {
            users: {
                shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
                buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            }
        },
        { timestamps: true }
    )
);
// For chatroom filter
Chatroom.collection.createIndex({ "users.shopId": 1 });
Chatroom.collection.createIndex({ "users.buyerId": 1 });


module.exports.getPastChatrooms = async (req, res) => {
    try {
        let response = {};
        let filter = {
            updatedAt: { $lt: new Date(req.fnParams.lastChatroomDate) }
        };
        let id = new mongoose.Types.ObjectId(req.auth._id);
        let limit = 5;

        if (req.auth.role === "buyer")
            filter["users.buyerId"] = new mongoose.Types.ObjectId(req.auth._id);
        else if (req.auth.role === "seller") {
            filter["users.shopId"] = new mongoose.Types.ObjectId(req.auth.shop?._id);
            id = new mongoose.Types.ObjectId(req.auth.shop?._id);
        }
        console.log('--filter', filter)
        const result = await Chatroom.aggregate([
            { $match: filter },
            { $sort: { updatedAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'shops',
                    let: { shopId: "$users.shopId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$shopId"] }
                            }
                        },
                        {
                            $project: {
                                name: "$businessName",
                                profile_picture: "$logo"
                            }
                        }
                    ],
                    as: "users.shop"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { buyerId: "$users.buyerId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$buyerId"] }
                            }
                        },
                        {
                            $project: {
                                name: { $concat: ["$firstname", " ", "$lastname"] },
                                profile_picture: "$profile_picture.url"
                            }
                        }
                    ],
                    as: "users.buyer"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$chatroomId", "$$chatroomId"]
                                }
                            }
                        },
                        {
                            $match: { status: "SENT" }
                        },
                        {
                            $count: "sentMessageCount"
                        }
                    ],
                    as: "sentMessagesCount"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id", shopId: "$users.shopId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$chatroomId", "$$chatroomId"]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "orders",
                                localField: "content.orderId",
                                foreignField: "_id",
                                as: "order"
                            }
                        },
                        {
                            $lookup: {
                                from: "products",
                                localField: "content.productId",
                                foreignField: "_id",
                                as: "product"
                            }
                        },
                        {
                            $addFields: {
                                order: {
                                    $cond: [
                                        { $gt: [{ $size: "$order" }, 0] },
                                        {
                                            $let: {
                                                vars: {
                                                    fullOrder: { $arrayElemAt: ["$order", 0] },
                                                    shopId: "$$shopId"
                                                },
                                                in: {
                                                    $mergeObjects: [
                                                        "$$fullOrder",
                                                        {
                                                            cart: {
                                                                $arrayElemAt: [{
                                                                    $filter: {
                                                                        input: "$$fullOrder.cart",
                                                                        as: "cartItem",
                                                                        cond: {
                                                                            $eq: ["$$cartItem.shopId", "$$shopId"]
                                                                        }
                                                                    }
                                                                }, 0]

                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        null
                                    ]
                                },
                                product: { $arrayElemAt: ["$product", 0] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                senderId: 1,
                                content: {
                                    message: 1,
                                    order: "$order",
                                    product: "$product"
                                },
                                status: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $limit: 20
                        },

                    ],
                    as: "latestMessages"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$chatroomId", "$$chatroomId"]
                                }
                            }
                        },
                        {
                            $match: { status: { $in: ["DELIVERED", "SENT"] }, receiverId: id }
                        },
                        {
                            $count: "sentMessageCount"
                        }
                    ],
                    as: "sentMessagesCount"
                }
            },
            {
                $addFields: {
                    sentMessageCount: { $ifNull: [{ $arrayElemAt: ["$sentMessagesCount.sentMessageCount", 0] }, 0] }
                }
            },
            {
                $project: {
                    _id: 1,
                    users: {
                        shop: { $arrayElemAt: ["$users.shop", 0] },
                        buyer: { $arrayElemAt: ["$users.buyer", 0] }
                    },
                    latestMessages: 1,
                    sentMessageCount: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        response = result;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Message::getPastChatrooms",
            error,
            req,
            res
        );
    }
};

module.exports.getChatrooms = async (req, res) => {

    try {
        let response = {};
        let filter = {};
        let id = new mongoose.Types.ObjectId(req.auth._id);
        let limit = 15;

        if (req.auth.role === "buyer")
            filter["users.buyerId"] = new mongoose.Types.ObjectId(req.auth._id);
        else if (req.auth.role === "seller") {
            filter["users.shopId"] = new mongoose.Types.ObjectId(req.auth.shop?._id);
            id = new mongoose.Types.ObjectId(req.auth.shop?._id);
        }

        const result = await Chatroom.aggregate([
            {
                $match: filter
            },
            { $sort: { updatedAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'shops',
                    let: { shopId: "$users.shopId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$shopId"] }
                            }
                        },
                        {
                            $project: {
                                name: "$businessName",
                                profile_picture: "$logo"
                            }
                        }
                    ],
                    as: "users.shop"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { buyerId: "$users.buyerId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$buyerId"] }
                            }
                        },
                        {
                            $project: {
                                name: { $concat: ["$firstname", " ", "$lastname"] },
                                profile_picture: "$profile_picture.url"
                            }
                        }
                    ],
                    as: "users.buyer"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$chatroomId", "$$chatroomId"]
                                }
                            }
                        },
                        {
                            $match: { status: "SENT" }
                        },
                        {
                            $count: "sentMessageCount"
                        }
                    ],
                    as: "sentMessagesCount"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id", shopId: "$users.shopId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$chatroomId", "$$chatroomId"]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "orders",
                                localField: "content.orderId",
                                foreignField: "_id",
                                as: "order"
                            }
                        },
                        {
                            $lookup: {
                                from: "products",
                                localField: "content.productId",
                                foreignField: "_id",
                                as: "product"
                            }
                        },
                        {
                            $addFields: {
                                order: {
                                    $cond: [
                                        { $gt: [{ $size: "$order" }, 0] },
                                        {
                                            $let: {
                                                vars: {
                                                    fullOrder: { $arrayElemAt: ["$order", 0] },
                                                    shopId: "$$shopId"
                                                },
                                                in: {
                                                    $mergeObjects: [
                                                        "$$fullOrder",
                                                        {
                                                            cart: {
                                                                $arrayElemAt: [{
                                                                    $filter: {
                                                                        input: "$$fullOrder.cart",
                                                                        as: "cartItem",
                                                                        cond: {
                                                                            $eq: ["$$cartItem.shopId", "$$shopId"]
                                                                        }
                                                                    }
                                                                }, 0]

                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        null
                                    ]
                                },
                                product: { $arrayElemAt: ["$product", 0] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                senderId: 1,
                                content: {
                                    message: 1,
                                    order: "$order",
                                    product: "$product"
                                },
                                status: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $limit: 20
                        },

                    ],
                    as: "latestMessages"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$chatroomId", "$$chatroomId"]
                                }
                            }
                        },
                        {
                            $match: { status: { $in: ["DELIVERED", "SENT"] }, receiverId: id }
                        },
                        {
                            $count: "sentMessageCount"
                        }
                    ],
                    as: "sentMessagesCount"
                }
            },
            {
                $addFields: {
                    sentMessageCount: { $ifNull: [{ $arrayElemAt: ["$sentMessagesCount.sentMessageCount", 0] }, 0] }
                }
            },
            {
                $project: {
                    _id: 1,
                    users: {
                        shop: { $arrayElemAt: ["$users.shop", 0] },
                        buyer: { $arrayElemAt: ["$users.buyer", 0] }
                    },
                    latestMessages: 1,
                    sentMessageCount: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        response = result;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Order::getChatrooms",
            error,
            req,
            res
        );
    }
};


module.exports.getChatroom = async (req, res) => {

    try {
        let response = {};
        let id = new mongoose.Types.ObjectId(req.auth._id);
        console.log('werwerwerwerwe1')
        let chatroomIdx = new mongoose.Types.ObjectId(req.fnParams.chatroomId)
        console.log('werwerwerwerwe2')
        const result = await Chatroom.aggregate([
            { $match: { _id: chatroomIdx } },
            {
                $lookup: {
                    from: 'shops',
                    let: { shopId: "$users.shopId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$shopId"] }
                            }
                        },
                        {
                            $project: {
                                name: "$businessName",
                                profile_picture: "$logo"
                            }
                        }
                    ],
                    as: "users.shop"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { buyerId: "$users.buyerId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$buyerId"] }
                            }
                        },
                        {
                            $project: {
                                name: { $concat: ["$firstname", " ", "$lastname"] },
                                profile_picture: "$profile_picture.url"
                            }
                        }
                    ],
                    as: "users.buyer"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$chatroomId", "$$chatroomId"]
                                }
                            }
                        },
                        {
                            $match: { status: "SENT" }
                        },
                        {
                            $count: "sentMessageCount"
                        }
                    ],
                    as: "sentMessagesCount"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id", shopId: "$users.shopId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$chatroomId", "$$chatroomId"]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "orders",
                                localField: "content.orderId",
                                foreignField: "_id",
                                as: "order"
                            }
                        },
                        {
                            $lookup: {
                                from: "products",
                                localField: "content.productId",
                                foreignField: "_id",
                                as: "product"
                            }
                        },
                        {
                            $addFields: {
                                order: {
                                    $cond: [
                                        { $gt: [{ $size: "$order" }, 0] },
                                        {
                                            $let: {
                                                vars: {
                                                    fullOrder: { $arrayElemAt: ["$order", 0] },
                                                    shopId: "$$shopId"
                                                },
                                                in: {
                                                    $mergeObjects: [
                                                        "$$fullOrder",
                                                        {
                                                            cart: {
                                                                $arrayElemAt: [{
                                                                    $filter: {
                                                                        input: "$$fullOrder.cart",
                                                                        as: "cartItem",
                                                                        cond: {
                                                                            $eq: ["$$cartItem.shopId", "$$shopId"]
                                                                        }
                                                                    }
                                                                }, 0]

                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        null
                                    ]
                                },
                                product: { $arrayElemAt: ["$product", 0] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                senderId: 1,
                                content: {
                                    message: 1,
                                    order: "$order",
                                    product: "$product"
                                },
                                status: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $limit: 20
                        },

                    ],
                    as: "latestMessages"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    let: { chatroomId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$chatroomId", "$$chatroomId"]
                                }
                            }
                        },
                        {
                            $match: { status: { $in: ["DELIVERED", "SENT"] }, receiverId: id }
                        },
                        {
                            $count: "sentMessageCount"
                        }
                    ],
                    as: "sentMessagesCount"
                }
            },
            {
                $addFields: {
                    sentMessageCount: { $ifNull: [{ $arrayElemAt: ["$sentMessagesCount.sentMessageCount", 0] }, 0] }
                }
            },
            {
                $project: {
                    _id: 1,
                    users: {
                        shop: { $arrayElemAt: ["$users.shop", 0] },
                        buyer: { $arrayElemAt: ["$users.buyer", 0] }
                    },
                    latestMessages: 1,
                    sentMessageCount: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);
        console.log('0------------', result)
        response.data = result;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Chatroom::getChatroom",
            error,
            req,
            res
        );
    }
};
