const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename, ".js"),
  _ = require("lodash"),
  {
    saveAsDraftTab2DTO,
    saveAsDraftTab3DTO,
    sendApplicationDTO,
    declineApplicationDTO,
    approveApplicationDTO
  } = require("../services/dto"),
  model = require(`./../models/${base}`),
  email = require("../services/email"),
  moment = require("moment-timezone"),
  companyController = require("./company"),
  { ObjectId } = require("mongodb");

cloudinary = require("../services/cloudinary");

module.exports.getShops = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const result = await model.getShops(req, res);
    response.data = result;

    // if (_.size(result) === 0) {
    //   response.data = [];
    // }

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Shops::getShops",
      error,
      req,
      res
    );
  }
};

module.exports.getNearestShops = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const result = await model.getNearestShops(req, res);
    response.data = result;

    // if (_.size(result) === 0) {
    //   response.data = [];
    // }

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Shops::getNearestShops",
      error,
      req,
      res
    );
  }
};

module.exports.getShopList = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const skip = req.query?.skip ? Number(req.query?.skip) : 0;
    const limit = req.query?.limit ? Number(req.query?.limit) : 2;
    const radius = req.query?.radius ? Number(req.query?.radius) : 3;
    const search = req.query?.search;
    let sort = 'createdAt';
    let sortType = -1;

    switch (req.query?.sort) {
      case 'nearest':
        sort = 'distance'
        sortType = 1
        break;
      case 'cheapest':
        sort = 'price'
        sortType = 1
        break;
    }

    req.fnParams = {
      skip: skip,
      limit: limit,
      radius: radius,
      search: search,
      sort: sort,
      sortType: sortType
    }
    /*
    switch (req.query.sort) {
      case 'nearest':
        sort = 'distance'
        sortType = 1
        break;
      case 'cheapest':
        sort = 'price'
        sortType = 1
        break;
    }
    */

    const [result] = await model.getShopList(req, res);
    response.data = result;

    // if (_.size(result) === 0) {
    //   response.data = [];
    // }

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Shops::getShopList",
      error,
      req,
      res
    );
  }
};


module.exports.getShop = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    const [result] = await model.getShop(req, res);

    response.data = result;


    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Shops::getShop",
      error,
      req,
      res
    );
  }
};

module.exports.saveAsDraftTab1 = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const { files } = req;
    const id = Math.random().toString(36).substring(2, 9);

    const uploadResults = {};
    const fields = ['bir', 'businessLogo', 'validID', 'businessPermit', 'ownerSelfie'];

    for (const field of fields) {
      if (files[field]) {
        const file = files[field][0];
        const publicId = `${id}_${file.originalname.split('.')[0]}`;

        const upload = await cloudinary.uploader.upload(file.path, {
          folder: "spoonwise",
          public_id: publicId,
          type: "authenticated",
          resource_type: "auto",
        });

        uploadResults[field] = upload.secure_url;
      }
    }

    // 💡 Flattened documents directly into dot notation
    const setFields = {};

    // ✅ Flatten specific document fields
    if (uploadResults.bir) setFields["documents.bir"] = uploadResults.bir;
    if (uploadResults.businessPermit) setFields["documents.businessPermit"] = uploadResults.businessPermit;
    if (uploadResults.ownerSelfie) setFields["documents.owner_selfie"] = uploadResults.ownerSelfie;
    if (uploadResults.validID) setFields["documents.validID"] = uploadResults.validID;// 💡 Flattened documents directly into dot notation
    // ✅ Add logo (if available)
    if (uploadResults.businessLogo) {
      setFields.logo = uploadResults.businessLogo;
    }

    req.fnParams = {
      shopId: req.auth.shop._id,
      updateFields: setFields, // for use in updateOne
    };

    console.log('==== req.fnParams', req.fnParams)

    const result = await model.saveAsDraftTab1(req, res);
    response.data = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Shop::saveAsDraftTab1",
      error,
      req,
      res
    );
  }
};

module.exports.saveAsDraftTab2 = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const { body } = req;
    console.log('=========saveAsDraftTab2', body)
    const joi = {
      coordinates: body.coordinates,
      province: body.province,
      municipality: body.municipality,
      barangay: body.barangay,
      address: body.address,
      phoneNumber: body.phoneNumber,
    };

    await saveAsDraftTab2DTO.validateAsync(joi);

    req.fnParams = {
      shopId: req.auth.shop._id,
      ...joi
    };

    console.log('==== req.fnParams', body)

    const result = await model.saveAsDraftTab2(req, res);
    response.data = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Shop::saveAsDraftTab2",
      error,
      req,
      res
    );
  }
};

module.exports.saveAsDraftTab3 = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const { body } = req;
    console.log('=========saveAsDraftTab3', body)
    const joi = {
      accountName: body.accountName,
      accountNumber: body.accountNumber,
    };

    await saveAsDraftTab3DTO.validateAsync(joi);

    req.fnParams = {
      shopId: req.auth.shop._id,
      ...joi
    };

    console.log('==== req.fnParams', body)

    const result = await model.saveAsDraftTab3(req, res);
    response.data = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Shop::saveAsDraftTab3",
      error,
      req,
      res
    );
  }
};


module.exports.sendApplication = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const { body } = req;

    const joi = {
      status: 'IN_PROGRESS',
    };

    await sendApplicationDTO.validateAsync(joi);

    req.fnParams = {
      shopId: req.auth.shop._id,
      ...joi
    };

    console.log('==== req.fnParams', body)

    const result = await model.sendApplication(req, res);
    response.data = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Shop::sendApplication",
      error,
      req,
      res
    );
  }
};

module.exports.declineApplication = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const { body } = req;

    const joi = {
      shopId: body.shopId,
      status: 'DECLINED',
      tab1: body.tab1,
      tab2: body.tab2,
      tab3: body.tab3
    };

    await declineApplicationDTO.validateAsync(joi);

    req.fnParams = {
      ...joi
    };

    const result = await model.declineApplication(req, res);
    response.data = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Shop::declineApplication",
      error,
      req,
      res
    );
  }
};

module.exports.approveApplication = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const { body } = req;

    const joi = {
      shopId: body.shopId,
      status: 'APPROVED',
    };

    await approveApplicationDTO.validateAsync(joi);

    req.fnParams = {
      ...joi
    };

    const result = await model.approveApplication(req, res);
    response.data = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Shop::approveApplication",
      error,
      req,
      res
    );
  }
};