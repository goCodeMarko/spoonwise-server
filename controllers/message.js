const padayon = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    _ = require("lodash"),
    chatroomController = require('./chatroom'),
    server = require('../server'),
    moment = require("moment-timezone"),
    openai = require("../services/openai"),
    cloudinary = require("./../services/cloudinary"),
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

        // Prepare initial parameters for message model
        req.fnParams = {
            chatroomId: req.params.chatroomId,

        }

        const { file } = req;
        let upload;
        console.log('----------------------file', file)
        if (file) {
            // try {
            console.log('1')
            req.body = JSON.parse(req.body.details)
            console.log('2')
            const { path } = file;
            console.log('3')
            const id = Math.random().toString(36).substring(2, 9);
            console.log('4', file.path)
            upload = await cloudinary.uploader.upload(file.path, {
                folder: "spoonwise",
                public_id: id + '_' + file.originalname.split('.')[0],
                type: "authenticated",
                resource_type: "auto",
            });
            console.log('5')
            req.body.attachments = [{ url: upload.secure_url }]
            // } catch (error) {
            //     console.log('error', error)
            // }

        }

        // Fetch the chatroom details
        const getChatroom = await chatroomController.getChatroom(req, res);
        // Destructure the first chatroom object from the response
        const [chatroom] = getChatroom.data.data

        // Re-assign fnParams for sending a new message
        req.fnParams = {
            elementId: req.body.elementId,
            chatroomId: req.params.chatroomId,
            content: {
                message: req.body.content.message,
                buttons: req.body.content.buttons || false,
                attachments: req.body.attachments
            },
            status: "SENT"
        }

        // If the chatroom is not with an AI agent, assign sender and receiver manually
        if (!chatroom.isAIAgent) {
            // Determine the senderId based on user's role
            req.fnParams.senderId =
                req.auth.role === 'seller' ? req.auth.shop?._id : req.auth._id;
            // Determine the receiverId (the other participant in the chat)
            req.fnParams.receiverId =
                req.auth.role === 'seller'
                    ? chatroom.users.buyer._id
                    : chatroom.users.shop._id;
        } else {
            // If it's an AI chatroom, check if the message is from the AI agent
            if (req.query.msgFromAIAgent) req.fnParams.isAIAgent = true; // Set isAIAgent to true if the message is from the AI agent
            else req.fnParams.isAIAgent = false; // Otherwise, it's from the user
        }

        const sendMessage = await model.sendMessage(req, res);

        // If the chatroom is not with an AI agent, emit the new message to the receiver
        if (!chatroom.isAIAgent) {
            const receiverId = sendMessage.receiverId.toString();
            if (!req.noEmitOnNewChatMessage) server.io.to(receiverId).emit('onNewChatMessage', { message: sendMessage, chatroom });
        }
        else if (chatroom.isAIAgent && !req.fnParams.isAIAgent) { // If it's an AI chatroom and the message is from the user
            req.chatroom = chatroom
            openai.generateChatResponse(req, res); // Generate a response from the AI agent
        }

        response.data = { ...sendMessage?._doc, isAIAgent: chatroom.isAIAgent };

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
        console.log('--...req.query', req.query)
        const isSpoonwiseAI = req.query.isSpoonwiseAI === 'true';
        req.fnParams = {
            ...req.params,
            isSpoonwiseAI
        }
        console.log('----fnParams', req.fnParams)
        const chatroom = await model.updateChatroomsMsgStatusToSeen(req, res);
        console.log('----fnParams', req.fnParams)
        console.log('-------------chatroom.messagesToUpdate.chatroomId', chatroom.messagesToUpdate.chatroomId)
        response.data = {
            chatroomId: chatroom.messagesToUpdate.chatroomId.toString(),
            senderId: !isSpoonwiseAI ? chatroom.messagesToUpdate.senderId.toString() : '',
            receiverId: !isSpoonwiseAI ? chatroom.messagesToUpdate.receiverId.toString() : ''
        };


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
