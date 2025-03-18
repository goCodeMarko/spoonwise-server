"use_strict";
const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename).split(".").shift(),
  moment = require("moment-timezone"),
  mongoose = require("mongoose");

  Category = mongoose.model(
    base,
    mongoose.Schema({
    name: { type: String,default: "" },
    id: { type: String,default: "" }
   },
   { timestamps: true }
    )
    );

module.exports.getCategories = async (req, res) => {
    try {
      const MQLBuilder = [
            { $project: {
                id: 1,
                name: 1
            }}
        ]
      const category = await Category.aggregate(MQLBuilder);
   
      return category;
    } catch (error) {
      padayon.ErrorHandler("Model::Category::getCategories", error, req, res);
    }
  };





