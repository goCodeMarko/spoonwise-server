"use_strict";

const path = require("path"),
  base = path.basename(__filename).split(".").shift(),
  mongoose = require("mongoose"),
  padayon = require("../services/padayon"),
  bcrypt = require("bcrypt"),
  _ = require('lodash');


const LineItemSchema = new mongoose.Schema(
  {
    checked: { type: Boolean, default: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    qty: { type: Number, default: 0 },
    orderQty: { type: Number, default: 0 },
    images: [{ type: String, default: [] }],
    expiryDate: { type: Date },
    price: { type: Number, default: 0 },
    description: { type: String, default: "" },
    category: [{ type: String, default: [] }],
    specialOffers: [{ type: Object, default: [] }]
  },
  { timestamps: true }
);

const StoreSchema = new mongoose.Schema(
  {
    checked: { type: Boolean, default: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    businessName: { type: String },
    coordinates: {
      lat: { type: Number, default: "" },
      lon: { type: Number, default: "" }
    },
    address1: { type: String, default: "" },
    address2: { type: String, default: "" },
  }
);

User = mongoose.model(
  base,
  mongoose.Schema({
    email: { type: String, maxlength: 50, required: true },
    password: { type: String, maxlength: 100, required: true },
    role: { type: String, maxlength: 20, default: "user" },
    firstname: { type: String, maxlength: 50 },
    middlename: { type: String, maxlength: 50 },
    lastname: { type: String, maxlength: 50 },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    qrcode: {
      publicId: { type: String, maxlength: 100 },
      format: { type: String, maxlength: 25 },
      url: { type: String, maxlength: 150 },
      text_output: { type: String, maxlength: 150 },
    },
    barcode: {
      publicId: { type: String, maxlength: 100 },
      format: { type: String, maxlength: 25 },
      url: { type: String, maxlength: 150 },
      text_output: { type: String, maxlength: 150 },
    },
    id_card: {
      front: {
        publicId: { type: String, maxlength: 100 },
        format: { type: String, maxlength: 25 },
        url: { type: String, maxlength: 150 },
      },
      back: {
        publicId: { type: String, maxlength: 100 },
        format: { type: String, maxlength: 25 },
        url: { type: String, maxlength: 150 },
      },
    },
    profile_picture: {
      publicId: { type: String, maxlength: 100 },
      format: { type: String, maxlength: 25 },
      url: { type: String, maxlength: 150 },
    },
    phoneNumber: { type: String },
    address1: { type: String },
    address2: { type: String },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    branch: { type: mongoose.Schema.Types.ObjectId },
    isallowedtodelete: { type: Boolean, default: true },
    isallowedtocreate: { type: Boolean, default: true },
    isallowedtoupdate: { type: Boolean, default: true },
    isblock: { type: Boolean, default: false },
    coordinates: {
      lat: { type: Number },
      lon: { type: Number }
    },
    cart: [
      {
        lineItems: [LineItemSchema],
        shop: StoreSchema
      }
    ]
  })
);

module.exports.getUser = async (req, res, callback) => {
  try {
    const { userId } = req.fnParams;

    let response = {};
    const [result] = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          email: 1,
          role: 1,
          fullname: {
            $concat: ["$firstname", " ", "$lastname"],
          },
          firstname: 1,
          lastname: 1,
          isallowedtodelete: 1,
          isallowedtocreate: 1,
          isallowedtoupdate: 1,
          isblock: 1,
          id_card: 1,
          barcode: 1,
          phoneNumber: 1,
          address1: 1,
          address2: 1,
          qrcode: 1,
          profile_picture: 1,
          company: 1,
          branch: 1,
          coordinates: 1,
          cart: 1
        },
      },
    ]);
    response = result;
    callback(response);
  } catch (error) {
    padayon.ErrorHandler("Model::User::getUser", error, req, res);
  }
}; //---------done

module.exports.getUsers = async (req, res, callback) => {
  try {
    let response = {};
    const result = await User.aggregate([
      {
        $match: {
          role: "admin",
        },
      },
      {
        $project: {
          email: 1,
          role: 1,
          fullname: {
            $concat: ["$firstname", " ", "$lastname"],
          },
          firstname: 1,
          lastname: 1,
          isallowedtodelete: 1,
          isallowedtocreate: 1,
          isallowedtoupdate: 1,
          isblock: 1,
          id_card: 1,
          barcode: 1,
          qrcode: 1,
          profile_picture: 1,
          company: 1,
          branch: 1,
        },
      },
    ]);

    response = result;
    callback(response);
  } catch (error) {
    padayon.ErrorHandler("Model::User::getUsers", error, req, res);
  }
};

module.exports.authenticate = async (req, res, callback) => {
  try {
    let response = {};
    const email = req.body.email;
    const password = req.body.password;

    let account = await User.aggregate([
      {
        $match: {
          email: email
        },
      },
      {
        $project: {
          email: 1,
          role: 1,
          fullname: {
            $concat: ["$firstname", " ", "$lastname"],
          },
          password: 1,
          profile_picture: 1,
          phoneNumber: 1,
          address1: 1,
          address2: 1,
          isblock: 1,
          company: 1,
          branch: 1,
          coordinates: 1,
          cart: 1
        },
      },
    ]);

    if (_.size(account)) {
      const bcryptResult = await bcrypt.compare(password, account[0].password);

      if (!bcryptResult) account = null;
      else delete account[0].password;

    }

    response = account;
    callback(response);
  } catch (error) {
    padayon.ErrorHandler("Model::User::authenticate", error, req, res);
  }
};

module.exports.updateUserAccess = async (req, res, callback) => {
  try {
    let response = {};
    const {
      userId,
      isallowedtodelete,
      isallowedtocreate,
      isallowedtoupdate,
      isblock,
    } = req.fnParams;
    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      {
        $set: {
          isallowedtodelete,
          isallowedtocreate,
          isallowedtoupdate,
          isblock,
        },
      }
    );

    response = result;
    callback(response);
  } catch (error) {
    padayon.ErrorHandler("Model::User::updateUserAccess", error, req, res);
  }
}; //---------done

module.exports.generateQR = async (req, res, callback) => {
  try {
    let response = {};
    const { secure_url, public_id, format, _id } = req.fnParams;

    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(_id) },
      {
        $set: {
          qrcode: {
            publicId: public_id,
            url: secure_url,
            format: format,
          },
        },
      }
    );

    response = result;
    callback(response);
  } catch (error) {
    padayon.ErrorHandler("Model::User::generateQR", error, req, res);
  }
}; //---------done

module.exports.generateIdCard = async (req, res, callback) => {
  try {
    let response = {};
    const { front_card, back_card, _id } = req.fnParams;

    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(_id) },
      {
        $set: {
          id_card: {
            front: {
              url: front_card?.secure_url,
              publicId: front_card?.public_id,
              format: front_card?.format,
            },
            back: {
              url: back_card?.secure_url,
              publicId: back_card?.public_id,
              format: back_card?.format,
            },
          },
        },
      }
    );

    response = result;
    callback(response);
  } catch (error) {
    padayon.ErrorHandler("Model::User::generateIdCard", error, req, res);
  }
}; //---------done

module.exports.generateBarcode = async (req, res, callback) => {
  try {
    let response = {};
    const { secure_url, public_id, format, _id, text_output } = req.fnParams;

    const result = await User.updateOne(
      { _id: new mongoose.Types.ObjectId(_id) },
      {
        $set: {
          barcode: {
            publicId: public_id,
            url: secure_url,
            format: format,
            text_output: text_output,
          },
        },
      }
    );

    response = result;
    callback(response);
  } catch (error) {
    padayon.ErrorHandler("Model::User::generateBarcode", error, req, res);
  }
}; //---------done

module.exports.verifyAccessControl = async (req, res, callback) => {
  try {
    let response = {};

    const { accessControls, _id } = req.fnParams;

    const result = await User.findOne({
      ...accessControls,
      _id: new mongoose.Types.ObjectId(_id),
    });

    response = result;

    callback(response);
  } catch (error) {
    padayon.ErrorHandler("Model::User::verifyAccessControl", error, req, res);
  }
}; //---------done

module.exports.addUser = async (req, res, callback) => {
  try {
    let response = {};
    const body = req.fnParams;

    const newUser = new User(body);
    const result = await newUser.save();

    response = result;
    callback(response);
  } catch (error) {
    padayon.ErrorHandler("Model::User::addUser", error, req, res);
  }
}; //---------done


module.exports.getCart = async (req, res) => {
  try {
    console.log('req.auth', req.auth)

    const MQLBuilder = [
      {
        $unwind: {
          path: "$cart"
        }
      },
      {
        $project: {
          _id: 1,
          shop: "$cart.shop",
          lineItems: {
            $map: {
              input: "$cart.lineItems",
              as: "item",
              in: {
                $mergeObjects: [
                  "$$item",
                  {
                    commission: {
                      $round: [
                        { $multiply: ["$$item.orderQty", "$$item.price", 0.1] },
                        2
                      ]
                    },
                    points: {
                      $round: [
                        { $multiply: ["$$item.orderQty", "$$item.price", 0.01] },
                        2
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: "$_id",
          cart: {
            $push: {
              shop: "$shop",
              lineItems: "$lineItems"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          cart: 1
        }
      }
    ]


    const [response] = await User.aggregate(MQLBuilder);


    console.log('-----------x', response)
    return response.cart;
  } catch (error) {
    padayon.ErrorHandler("Model::User::getCart", error, req, res);
  }
};


module.exports.removeCheckedCartLineItems = async (req, res) => {

  const removeCheckedLineItemInCart = await User.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(req.auth._id),
      'cart.lineItems.checked': true,
    },
    {
      $pull: {
        'cart.$[].lineItems': { checked: true },
      },
    },
    { new: true }
  );

  const removeCartItemWithoutLineItem = await User.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(req.auth._id),
    },
    {
      $pull: {
        cart: { lineItems: { $eq: [] } }, // Removes ALL carts where `lineItems` is an empty array
      },
    },
    { new: true }
  );

  return removeCheckedLineItemInCart;
};

module.exports.addToCart = async (req, res) => {
  try {
    let response;

    // Step 1: Check if the shop, and product already exist in the cart
    const [cart] = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.auth._id) } }, // Find the user
      { $unwind: "$cart" }, // Deconstruct the cart array
      { $match: { "cart.shop.shopId": new mongoose.Types.ObjectId(req.body.shop.shopId) } }, // Match the shop
      {
        $project: {
          shop: "$cart.shop.shopId",
          product: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$cart.lineItems",
                  as: "item",
                  cond: { $eq: ["$$item.productId", new mongoose.Types.ObjectId(req.body.lineItem.productId)] },
                },
              },
              0,
            ],
          },
        },
      },
    ]);

    let shop = cart ? cart : false;

    if (shop) {
      console.log("Shop Exists");
      let product = shop.product ? shop.product : false;

      if (product) {
        console.log("Product Exists");

        response = await User.updateOne(
          {
            _id: new mongoose.Types.ObjectId(req.auth._id),
            "cart.shop.shopId": new mongoose.Types.ObjectId(req.body.shop.shopId),
            "cart.lineItems.productId": new mongoose.Types.ObjectId(req.body.lineItem.productId),
          },
          {
            $set: {
              "cart.$[shop].lineItems.$[item].orderQty": req.body.lineItem.orderQty,
              "cart.$[shop].lineItems.$[item].checked": req.body.lineItem.checked,
            },
          },
          {
            arrayFilters: [
              { "shop.shop.shopId": new mongoose.Types.ObjectId(req.body.shop.shopId) },
              { "item.productId": new mongoose.Types.ObjectId(req.body.lineItem.productId) },
            ],
          }
        );
      } else {
        console.log("No Product Found");
        response = await User.updateOne(
          {
            _id: new mongoose.Types.ObjectId(req.auth._id),
            "cart.shop.shopId": new mongoose.Types.ObjectId(req.body.shop.shopId),
          },
          {
            $push: {
              "cart.$.lineItems": req.body.lineItem,
            },
          }
        );
      }
    } else {
      console.log("No Shop Found");

      response = await User.updateOne(
        { _id: new mongoose.Types.ObjectId(req.auth._id) },
        {
          $push: {
            cart: {
              shop: req.body.shop,
              lineItems: [req.body.lineItem],
            },
          },
        }
      );
    }


    return response;
  } catch (error) {
    padayon.ErrorHandler("Model::User::addToCart", error, req, res);
  }
};