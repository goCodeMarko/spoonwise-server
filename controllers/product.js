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
    console.log('333432')
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

module.exports.createProduct = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const { files } = req;
    const body = JSON.parse(req.body.details)
    const id = Math.random().toString(36).substring(2, 9);

    let uploads = [];

    for (const file of files) {
      const { path } = file;

      const upload = await cloudinary.uploader.upload(path, {
        folder: "spoonwise",
        public_id: id + '_' + file.originalname.split('.')[0],
        type: "authenticated",
        resource_type: "auto",
      });

      uploads.push(upload);
    }

    // Convert local time to UTC using the client's timezone
    const dateTime = moment
      .tz(body.expiryDate, "YYYY-MM-DDTHH:mm:ss", req.timezone)
      .utc();
    const dateUTC = dateTime.toISOString();
    body.expiryDate = dateUTC;

    req.fnParams = {
      shopId: req.auth.shop?._id,
      name: body.name,
      qty: body.qty,
      expiryDate: body.expiryDate,
      price: body.price,
      description: body.description,
      category: body.category,
      specialOffers: body.specialOffers,
      isPublish: body.online,
      images: uploads.map(img => img.secure_url)
    }

    const result = await model.createProduct(req, res);
    response.data = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Product::createProduct",
      error,
      req,
      res
    );
  }
};

module.exports.togglePublishStatus = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    console.log('togglePublishStatus', req)
    const { id } = req.params;
    const { status } = req.body;

    req.fnParams = {
      id,
      status
    }

    const result = await model.togglePublishStatus(req, res);
    response.data = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Product::togglePublishStatus",
      error,
      req,
      res
    );
  }
};