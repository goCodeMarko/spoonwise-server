"use_strict";

const padayon = require("../services/padayon"),
    path = require("path"),
    _ = require("lodash"),
    base = path.basename(__filename).split(".").shift(),
    moment = require("moment-timezone"),
    mongoose = require("mongoose");

Message = mongoose.model(
    base,
    mongoose.Schema(
        {
            elementId: { type: String, required: true },
            chatroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatroom' },
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
            receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
            content: {
                orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
                message: { type: String, required: false },
                attachments: [{ url: { type: String, required: false } }],
                buttons: { type: mongoose.Schema.Types.Boolean, default: false }
            },
            status: { type: String },
            isAIAgent: { type: mongoose.Schema.Types.Boolean },
        },
        { timestamps: true }
    )
);

Message.collection.createIndex({ "status": 1, "receiverId": 1, "senderId": 1 });


module.exports.getPastMessages = async (req, res) => {
    try {
        let response = {};
        let limit = 20;

        const matchStage = {
            chatroomId: new mongoose.Types.ObjectId(req.fnParams.chatroomId),
            createdAt: { $lt: new Date(req.fnParams.lastMessageDate) }
        };

        const result = await Message.aggregate([
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            {
                $project: {
                    elementId: 1,
                    chatroomId: 1,
                    senderId: 1,
                    receiverId: 1,
                    content: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                }
            }
        ]);

        console.log('----result', result)

        response = result;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Message::getPastMessages",
            error,
            req,
            res
        );
    }
};


module.exports.totalCountSentMessages = async (req, res) => {

    try {
        let response = {};

        let id = new mongoose.Types.ObjectId(req.auth._id);

        if (req.auth.role === "seller") id = new mongoose.Types.ObjectId(req.auth.shop?._id);

        const result = await Message.countDocuments({ status: { $in: ["DELIVERED", "SENT"] }, receiverId: id });

        response = result;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Message::totalCountSentMessages",
            error,
            req,
            res
        );
    }
};

module.exports.sendMessage = async (req, res) => {

    try {
        const body = req.fnParams;

        console.log('body', body)

        const message = new Message(body);

        const result = await message.save();

        // Manually update the chatroom's updatedAt
        const chatroom = await Chatroom.findByIdAndUpdate(
            body.chatroomId,
            { $set: { updatedAt: new Date() } }
        );
        console.log('---------result', result)
        return result;
    } catch (error) {
        padayon.ErrorHandler(
            "Model::Message::sendMessage",
            error,
            req,
            res
        );
    }
};

module.exports.updateChatroomsMsgStatusToDelivered = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction(); // ✅ Start transaction 
    try {
        const messagesToUpdate = await Message.find(
            {
                status: 'SENT',
                receiverId: req.auth.role === 'seller' ? req.auth.shop?._id : req.auth._id
            },
            { chatroomId: 1, senderId: 1, receiverId: 1 }
        );

        const result = await Message.updateMany(
            {
                status: 'SENT',
                receiverId: req.auth.role === 'seller' ? req.auth.shop?._id : req.auth._id
            },
            {
                $set: { status: 'DELIVERED' }
            }
        );
        const uniqueMap = new Map();

        messagesToUpdate.forEach((msg) => {
            const chatroomId = msg.chatroomId.toString();

            if (!uniqueMap.has(chatroomId)) {
                uniqueMap.set(chatroomId, {
                    chatroomId,
                    senderId: msg.senderId.toString(),
                    receiverId: msg.receiverId.toString(),
                });
            }
        });


        const chatroomUpdated = Array.from(uniqueMap.values());

        console.log('chatroomUpdated', chatroomUpdated)
        await session.commitTransaction(); // ✅ If all operations succeed, commit the transaction
        session.endSession();

        return {
            chatroomUpdated
        };
    } catch (error) {
        await session.abortTransaction(); // ❌ If any operation fails, rollback the transaction
        session.endSession();
        padayon.ErrorHandler(
            "Model::Message::updateChatroomsMsgStatusToDelivered",
            error,
            req,
            res
        );
    }
};

module.exports.updateChatroomsMsgStatusToSeen = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction(); // ✅ Start transaction 
    try {
        const filter = {
            chatroomId: new mongoose.Types.ObjectId(req.fnParams.chatroomId),
            status: { $in: ['SENT', 'DELIVERED'] },
        };

        if (!req.fnParams.isSpoonwiseAI) {
            filter.receiverId = req.auth.role === 'seller' ? req.auth.shop?._id : req.auth._id;
        }
        const messagesToUpdate = await Message.findOne(
            filter,
            { chatroomId: 1, senderId: 1, receiverId: 1 }
        );

        const result = await Message.updateMany(
            filter,
            {
                $set: { status: 'SEEN' }
            },
            {
                new: true
            }
        );

        await session.commitTransaction(); // ✅ If all operations succeed, commit the transaction
        session.endSession();

        return { messagesToUpdate, result };
    } catch (error) {
        await session.abortTransaction(); // ❌ If any operation fails, rollback the transaction
        session.endSession();
        padayon.ErrorHandler(
            "Model::Message::updateChatroomsMsgStatusToSeen",
            error,
            req,
            res
        );
    }
};