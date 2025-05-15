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



module.exports.getChatrooms = async (req, res) => {

    try {
        let response = {};
        let filter = {};
        let id = new mongoose.Types.ObjectId(req.auth._id);

        if (req.auth.role === "buyer")
            filter["users.buyerId"] = new mongoose.Types.ObjectId(req.auth._id);
        else if (req.auth.role === "seller") {
            filter["users.shopId"] = new mongoose.Types.ObjectId(req.auth.shop);
            id = new mongoose.Types.ObjectId(req.auth.shop);
        }

        const result = await Chatroom.aggregate([
            {
                $match: filter
            },
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
                                createdAt: 1
                            }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $limit: 15
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
                    sentMessageCount: 1
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
        let chatroomId = new mongoose.Types.ObjectId(req.fnParams.chatroomId)

        const result = await Chatroom.findOne({ _id: chatroomId });

        response = result;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Order::getChatroom",
            error,
            req,
            res
        );
    }
};
