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

  module.exports.getProducts = async (req, res) => {
    try {
      let response = { success: true, code: 200 };
  
      const result = await model.getProducts(req, res);
      response.data = result;
        
      // if (_.size(result) === 0) {
      //   response.data = [];
      // }
  
      return response;
    } catch (error) {
      padayon.ErrorHandler(
        "Controller::Product::getProducts",
        error,
        req,
        res
      );
    }
  };

  module.exports.getProduct = async (req, res) => {
    try {
      let response = { success: true, code: 200 };
      console.log('---------1')
      const result = await model.getProduct(req, res);
      console.log('---------2')
      response.data = result;
        
      // if (_.size(result) === 0) {
      //   response.data = [];
      // }
  
      return response;
    } catch (error) {
      padayon.ErrorHandler(
        "Controller::Product::getProduct",
        error,
        req,
        res
      );
    }
  };