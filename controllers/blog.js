const padayon = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    _ = require("lodash"),
    {
        blogDTO,
    } = require("../services/dto"),
    model = require(`./../models/${base}`),
    email = require("./../services/email"),
    moment = require("moment-timezone"),
    companyController = require("./company"),
    { ObjectId } = require("mongodb");

module.exports.createBlog = async (req, res) => {
    try {
        let response = { success: true, code: 200 };
        console.log('---c', req.body)
        const { title, content, status, audience } = req.body;

        const joi = {
            title,
            content,
            status,
            audience
        };

        await blogDTO.validateAsync(joi);

        req.fnParams = {
            title,
            content,
            status,
            audience
        }

        const result = await model.createBlog(req, res);
        response.data = result;
        console.log('--------------result', response)
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Blog::createBlog",
            error,
            req,
            res
        );
    }
};

module.exports.updateBlog = async (req, res) => {
    try {
        let response = { success: true, code: 200 };
        console.log('---c', req.body)
        const { title, content, status, audience } = req.body;

        const joi = {
            title,
            content,
            status,
            audience
        };

        await blogDTO.validateAsync(joi);

        req.fnParams = {
            title,
            content,
            status,
            audience
        }

        const result = await model.updateBlog(req, res);
        response.data = result;
        console.log('--------------result', response)
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Blog::updateBlog",
            error,
            req,
            res
        );
    }
};

module.exports.getBlogs = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        const result = await model.getBlogs(req, res);

        response.data = result;

        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Blog::getBlogs",
            error,
            req,
            res
        );
    }
};

module.exports.getPastBlogs = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        const result = await model.getPastBlogs(req, res);

        response.data = result;

        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Blog::getPastBlogs",
            error,
            req,
            res
        );
    }
};

module.exports.getBlog = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        const result = await model.getBlog(req, res);

        response.data = result;

        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Blog::getBlog",
            error,
            req,
            res
        );
    }
};

