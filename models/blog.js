"use_strict";
const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename).split(".").shift(),
  moment = require("moment-timezone"),
  mongoose = require("mongoose"),
  _ = require("lodash");

const BlogSchema = new mongoose.Schema({
  audience: { type: String, enum: ["PUBLIC", "SELLER", "BUYER"], default: "PUBLIC" },
  title: { type: String, default: "" },
  content: { type: String, default: "" },
  status: { type: String, enum: ["DRAFT", "PUBLISHED", "ARCHIVED"], default: "DRAFT" },
}, {
  timestamps: true
});

const Blog = mongoose.model(base, BlogSchema);



module.exports.createBlog = async (req, res) => {
  try {
    const body = req.fnParams;

    const blog = new Blog(body);

    const result = await blog.save();

    response = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Blog::createBlog",
      error,
      req,
      res
    );
  }
}

module.exports.updateBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const body = req.fnParams;
    console.log('---updateBlog---', blogId);
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      body,
      { new: true, runValidators: true } // returns the updated document
    );


    response = updatedBlog;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Blog::updateBlog",
      error,
      req,
      res
    );
  }
}

module.exports.getBlogs = async (req, res) => {
  try {
    const MQLBuilder = [
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
    ];


    const blog = await Blog.aggregate(MQLBuilder);
    console.log('---blog---', blog);
    return blog;
  } catch (error) {
    padayon.ErrorHandler("Model::Blog::getBlogs", error, req, res);
  }
};

module.exports.getPastBlogs = async (req, res) => {
  try {

    if (!req.query.lastBlogDate) {
      throw new padayon.BadRequestException("Missing last blog date query parameter");
    }
    const filter = {
      updatedAt: { $lt: new Date(req.query.lastBlogDate) }
    };

    console.log('----', req.query.lastBlogDate)
    const MQLBuilder = [

      { $match: filter },
      { $sort: { updatedAt: -1 } },
      { $limit: 10 },
    ];

    const blog = await Blog.aggregate(MQLBuilder);

    return blog;
  } catch (error) {
    padayon.ErrorHandler("Model::Blog::getPastBlogs", error, req, res);
  }
};

module.exports.getBlog = async (req, res) => {
  try {

    if (!req.params.blogId) {
      throw new padayon.BadRequestException("Missing blog ID parameter");
    }

    const blog = await Blog.findById(req.params.blogId)
    console.log('---blog---', blog);
    return blog;
  } catch (error) {
    padayon.ErrorHandler("Model::Blog::getBlog", error, req, res);
  }
};







