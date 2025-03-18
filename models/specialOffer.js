"use_strict";
const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename).split(".").shift(),
  moment = require("moment-timezone"),
  mongoose = require("mongoose");

  Specialoffer = mongoose.model(
    base,
    mongoose.Schema({
    name: { type: String,default: "" },
    id: { type: String,default: "" }
   },
   { timestamps: true } )
    );

module.exports.getSpecialOffers = async (req, res) => {
    try {
      const MQLBuilder = [
            { $project: {
                id: 1,
                name: 1
            }}
        ]
      const offer = await Specialoffer.aggregate(MQLBuilder);
   
      return offer;
    } catch (error) {
      padayon.ErrorHandler("Model::Category::getSpecialOffers", error, req, res);
    }
  };





