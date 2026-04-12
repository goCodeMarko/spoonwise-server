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
            },
            isAIAgent: { type: mongoose.Schema.Types.Boolean, default: false },
            settings: {
                language: { type: String, enum: ["ENGLISH", "TAGALOG", "CEBUANO", "ILOCANO", "HILIGAYNON", "KAPAMPANGAN", "WARAY"] },
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
                                isAIAgent: 1,
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
                                    product: "$product",
                                    attachments: 1,
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

        const [spoonwiseAIChatroom] = await getSpoonwiseAIChatroom(req, res);
        response = {
            chatrooms: result,
            spoonwiseAI: spoonwiseAIChatroom
        };
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Chatroom::getChatrooms",
            error,
            req,
            res
        );
    }
};

getSpoonwiseAIChatroom = async (req, res) => {

    try {

        const id = new mongoose.Types.ObjectId(req.auth.spoonwiseAI);
        console.log('----req.auth.spoonwiseAI', req.auth.spoonwiseAI)
        const result = await Chatroom.aggregate([
            { $match: { _id: id } },
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
                                    product: "$product",
                                    buttons: 1,
                                    attachments: 1,
                                },
                                isAIAgent: 1,
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
                            $match: { status: { $in: ["DELIVERED", "SENT"] }, isAIAgent: true }
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
                    latestMessages: 1,
                    sentMessageCount: 1,
                    settings: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }

        ]);
        if (result.length === 0) {
            throw new padayon.BadRequestException("Spoonwise AI chatroom not found");
        }
        response = result;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Chatroom::getSpoonwiseAIChatroom",
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

        let chatroomIdx = new mongoose.Types.ObjectId(req.fnParams.chatroomId)


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
                                isAIAgent: 1,
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
                    isAIAgent: 1,
                    settings: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

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

module.exports.updateLanguage = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await Chatroom.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(req.fnParams.chatroomId),
            },
            {
                $set: { 'settings.language': req.fnParams.language }
            },
            {
                new: true
            }
        );

        await session.commitTransaction();
        session.endSession();
        console.log('----result', result)
        return { result };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        padayon.ErrorHandler(
            "Model::Chatroom::updateLanguage",
            error,
            req,
            res
        );
    }
}

module.exports.checkChatroomExists = async (req, res) => {
    try {
        const result = await Chatroom.findOne(
            {
                users: {
                    shopId: new mongoose.Types.ObjectId(req.fnParams.shopId),
                    buyerId: new mongoose.Types.ObjectId(req.auth._id)
                }
            }
        );

        return result;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Chatroom::checkChatroomExists",
            error,
            req,
            res
        );
    }
}

module.exports.createChatroom = async (req, res) => {
    try {
        const body = {
            users: {
                buyerId: new mongoose.Types.ObjectId(req.auth._id),
                shopId: new mongoose.Types.ObjectId(req.fnParams.shopId)
            }
        };

        const chatroom = new Chatroom(body);

        const result = await chatroom.save();


        return result;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Chatroom::createChatroom",
            error,
            req,
            res
        );
    }
}

module.exports.createSpoonwiseAIChatroom = async (req, res) => {
    try {
        const { userId, shopId } = req.fnParams;
        if (!userId) {
            throw new padayon.BadRequestException("Missing userId.");
        }

        const body = {
            settings: {
                language: "TAGALOG"
            },
            isAIAgent: true
        };

        const chatroom = new Chatroom(body);
        const result = await chatroom.save();

        return result;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Chatroom::createSpoonwiseAIChatroom",
            error,
            req,
            res
        );
    }
};
