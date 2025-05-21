const padayon = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    _ = require("lodash"),
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
            "Controller::Message::getPastChatrooms",
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

