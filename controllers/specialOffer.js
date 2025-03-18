const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename, ".js"),
  _ = require("lodash"),
  {
    cashinDTO,
    cashoutDTO,
    updateTransactionStatusDTO,
    approveCashinDTO,
    createTransactionDTO,
  } = require("../services/dto"),
  model = require(`./../models/${base}`),
  email = require("./../services/email"),
  moment = require("moment-timezone"),
  companyController = require("./company"),
   { ObjectId } = require("mongodb");

  cloudinary = require("./../services/cloudinary");

  module.exports.getSpecialOffers = async (req, res) => {
    try {
      let response = { success: true, code: 200 };
  
      const result = await model.getSpecialOffers(req, res);
      response.data = result;
        
      // if (_.size(result) === 0) {
      //   response.data = [];
      // }
  
      return response;
    } catch (error) {
      padayon.ErrorHandler(
        "Controller::SpecialOffer::getSpecialOffer",
        error,
        req,
        res
      );
    }
  };