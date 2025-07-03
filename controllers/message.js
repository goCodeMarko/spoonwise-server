const padayon = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    _ = require("lodash"),
    chatroomController = require('./chatroom'),
    server = require('../server'),
    moment = require("moment-timezone"),
    model = require(`./../models/${base}`);


module.exports.getPastMessages = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        req.fnParams = {
            ...req.params,
            ...req.query
        }

        console.log('req.fnParams', req.fnParams)

        const pastMessages = await model.getPastMessages(req, res);

        response.data = pastMessages

        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Message::getPastMessages",
            error,
            req,
            res
        );
    }
};

module.exports.totalCountSentMessages = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        req.body = {

        }

        const totalCountSentMessages = await model.totalCountSentMessages(req, res);


        response.data = totalCountSentMessages;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Message::totalCountSentMessages",
            error,
            req,
            res
        );
    }
};

module.exports.sendMessage = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        req.fnParams = {
            chatroomId: req.params.chatroomId,
        }
        console.log('req.fnParams', req.fnParams)
        const chatroom = await chatroomController.getChatroom(req, res);
        const [chatroomObj] = chatroom.data.data
        console.log('xxxxxxxxxxxxxx', chatroomObj)
        req.fnParams = {
            elementId: req.body.elementId,
            chatroomId: req.params.chatroomId,
            senderId: req.auth.role === 'seller' ? req.auth.shop?._id : req.auth._id,
            receiverId: req.auth.role === 'seller' ? chatroomObj.users.buyer._id : chatroomObj.users.shop._id,
            content: req.body.content,
            status: "SENT"
        }

        console.log('req.fnParams', req.fnParams)
        const sendMessage = await model.sendMessage(req, res);
        console.log('sendMessage', sendMessage)
        const receiverId = sendMessage.receiverId.toString();

        server.io.to(receiverId).emit('onNewChatMessage', { message: sendMessage, chatroom: chatroomObj });

        response.data = sendMessage;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Message::sendMessage",
            error,
            req,
            res
        );
    }
};


module.exports.updateChatroomsMsgStatusToDelivered = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        req.fnParams = {
            ...req.query
        }

        const chatrooms = await model.updateChatroomsMsgStatusToDelivered(req, res);

        chatrooms.chatroomUpdated.forEach(chatroomUpdated => {
            server.io.to(chatroomUpdated.senderId).emit('onUpdateChatroomsMsgStatusToDelivered', { chatroomUpdated });
        });

        response.data = chatrooms;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Message::updateChatroomsMsgStatusToDelivered",
            error,
            req,
            re
        );
    }
};


module.exports.updateChatroomsMsgStatusToSeen = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        req.fnParams = {
            ...req.params
        }

        const chatroom = await model.updateChatroomsMsgStatusToSeen(req, res);
        console.log('----chatroom', chatroom)
        response.data = { chatroomId: chatroom.messagesToUpdate.chatroomId.toString(), senderId: chatroom.messagesToUpdate.senderId.toString(), receiverId: chatroom.messagesToUpdate.receiverId.toString(), };


        server.io.to(response.data.senderId).emit('onUpdateChatroomsMsgStatusToSeen', { ...response.data });

        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Message::updateChatroomsMsgStatusToSeen",
            error,
            req,
            res
        );
    }
};
