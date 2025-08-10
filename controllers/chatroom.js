const padayon = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    _ = require("lodash"),
    message = require("./../models/message"),
    model = require(`./../models/${base}`);


module.exports.getPastChatrooms = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        req.fnParams = {
            ...req.query
        }

        console.log('req.fnParams', req.fnParams)

        const pastChatrooms = await model.getPastChatrooms(req, res);

        response.data = pastChatrooms

        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Chatroom::getPastChatrooms",
            error,
            req,
            res
        );
    }
};

module.exports.getChatrooms = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        req.body = {

        }

        const getChatrooms = await model.getChatrooms(req, res);

        response.data = getChatrooms;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Order::getChatrooms",
            error,
            req,
            res
        );
    }
};

module.exports.getChatroom = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        req.fnParams = {
            chatroomId: req.fnParams.chatroomId
        }

        const getChatroom = await model.getChatroom(req, res);


        response.data = getChatroom;
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Order::getChatrooms",
            error,
            req,
            res
        );
    }
};

module.exports.updateLanguage = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        req.fnParams = {
            ...req.body,
            ...req.params
        }

        console.log('req.fnParams', req.fnParams)

        const pastChatrooms = await model.updateLanguage(req, res);

        response.data = pastChatrooms

        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Chatroom::updateLanguage",
            error,
            req,
            res
        );
    }
};

module.exports.chatSeller = async (req, res) => {
    try {
        let response = { success: true, code: 200 };
        req.fnParams = {
            shopId: req.query.shopId,
        }

        // Check if chatroom exists
        const checkChatroomExists = await model.checkChatroomExists(req, res);

        if (checkChatroomExists) { // If chatroom exists
            Object.assign(req.fnParams, {
                chatroomId: checkChatroomExists._id
            });

            const getChatroom = await model.getChatroom(req, res); // Get chatroom details

            response.data = _.size(getChatroom.data) > 0 ? getChatroom.data[0] : null;
        } else {
            const createChatroom = await model.createChatroom(req, res); // Create chatroom

            if (createChatroom) {

                req.fnParams = {
                    chatroomId: createChatroom._id,
                    senderId: req.query.shopId,
                    receiverId: req.auth._id,
                    content: {
                        message: 'Hello buyer, how can I help you?',
                    },
                    status: 'SENT'
                }

                await message.sendMessage(req, res);

                const getChatroom = await model.getChatroom(req, res); // Get chatroom details
                console.log('---------------getChatroom2', getChatroom)
                response.data = _.size(getChatroom.data) > 0 ? getChatroom.data[0] : null;
            }

        }

        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Chatroom::chatSeller",
            error,
            req,
            res
        );
    }
};

