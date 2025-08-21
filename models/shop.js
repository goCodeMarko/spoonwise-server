"use_strict";
const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename).split(".").shift(),
  moment = require("moment-timezone"),
  mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema({
  businessName: { type: String, default: "" },
  logo: { type: String, default: "" },
  documents: {
    bir: { type: String, default: "" },
    businessPermit: { type: String, default: "" },
    owner_selfie: { type: String, default: "" },
    validID: { type: String, default: "" },
  },
  province: { type: String, default: "" },
  municipality: { type: String, default: "" },
  barangay: { type: String, default: "" },
  address: { type: String, default: "" },

  coordinates: {
    lat: { type: String, default: "" },
    lng: { type: String, default: "" }
  },
  phoneNumber: { type: String },
  settlement_account: {
    accountNumber: { type: String, default: "" },
    accountName: { type: String, default: "" }
  },
  verification_process: {
    status: { type: String, enum: ["NOT_STARTED", "IN_PROGRESS", "DECLINED", "APPROVED"], default: "NOT_STARTED" },
    errors: {
      tab1: { type: String, default: "" },
      tab2: { type: String, default: "" },
      tab3: { type: String, default: "" }
    },
    updatedAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

const Shop = mongoose.model("Shop", ShopSchema);

module.exports = Shop;

module.exports.getShops = async (req, res) => {
  try {
    const buyer = {
      lat: req.auth.coordinates.lat,
      lng: req.auth.coordinates.lng
    }

    const MQLBuilder = [
      {
        $project: {
          _id: 1,
          businessName: 1,
          barangay: 1,
          municipality: 1,
          province: 1,
          address: 1,
          coordinates: {
            lat: '$coordinates.lat',
            lng: '$coordinates.lng'
          },
          distance: {
            $round: [
              {
                $multiply: [
                  6371,
                  {
                    $acos: {
                      $add: [
                        {
                          $multiply: [
                            {
                              $sin: {
                                $multiply: [
                                  {
                                    $divide: [
                                      { $toDouble: buyer.lat },
                                      180
                                    ]
                                  },
                                  3.141592653589793
                                ]
                              }
                            },
                            {
                              $sin: {
                                $multiply: [
                                  {
                                    $divide: [
                                      { $toDouble: "$coordinates.lat" },
                                      180
                                    ]
                                  },
                                  3.141592653589793
                                ]
                              }
                            }
                          ]
                        },
                        {
                          $multiply: [
                            {
                              $cos: {
                                $multiply: [
                                  {
                                    $divide: [
                                      { $toDouble: buyer.lat },
                                      180
                                    ]
                                  },
                                  3.141592653589793
                                ]
                              }
                            },
                            {
                              $cos: {
                                $multiply: [
                                  {
                                    $divide: [
                                      { $toDouble: "$coordinates.lat" },
                                      180
                                    ]
                                  },
                                  3.141592653589793
                                ]
                              }
                            },
                            {
                              $cos: {
                                $multiply: [
                                  {
                                    $subtract: [
                                      {
                                        $multiply: [
                                          {
                                            $divide:
                                              [
                                                { $toDouble: buyer.lng },
                                                180
                                              ]
                                          },
                                          3.141592653589793
                                        ]
                                      },
                                      {
                                        $multiply: [
                                          {
                                            $divide:
                                              [
                                                { $toDouble: "$coordinates.lng" },
                                                180
                                              ]
                                          },
                                          3.141592653589793
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      ]
                    }
                  }
                ]
              },
              1
            ]
          }
        }
      }
    ]
    const shops = await Shop.aggregate(MQLBuilder);

    return shops;
  } catch (error) {
    padayon.ErrorHandler("Model::Category::getShops", error, req, res);
  }
};

module.exports.getNearestShops = async (req, res) => {
  try {
    const buyer = {
      lat: req.auth.coordinates.lat,
      lng: req.auth.coordinates.lng
    }

    const MQLBuilder = [

      {
        $project: {
          _id: 1,
          businessName: 1,
          barangay: 1,
          municipality: 1,
          province: 1,
          address: 1,
          coordinates: {
            lat: '$coordinates.lat',
            lng: '$coordinates.lng'
          },
          distance: {
            $round: [
              {
                $multiply: [
                  6371,
                  {
                    $acos: {
                      $add: [
                        {
                          $multiply: [
                            {
                              $sin: {
                                $multiply: [
                                  {
                                    $divide: [
                                      { $toDouble: buyer.lat },
                                      180
                                    ]
                                  },
                                  3.141592653589793
                                ]
                              }
                            },
                            {
                              $sin: {
                                $multiply: [
                                  {
                                    $divide: [
                                      { $toDouble: "$coordinates.lat" },
                                      180
                                    ]
                                  },
                                  3.141592653589793
                                ]
                              }
                            }
                          ]
                        },
                        {
                          $multiply: [
                            {
                              $cos: {
                                $multiply: [
                                  {
                                    $divide: [
                                      { $toDouble: buyer.lat },
                                      180
                                    ]
                                  },
                                  3.141592653589793
                                ]
                              }
                            },
                            {
                              $cos: {
                                $multiply: [
                                  {
                                    $divide: [
                                      { $toDouble: "$coordinates.lat" },
                                      180
                                    ]
                                  },
                                  3.141592653589793
                                ]
                              }
                            },
                            {
                              $cos: {
                                $multiply: [
                                  {
                                    $subtract: [
                                      {
                                        $multiply: [
                                          {
                                            $divide:
                                              [
                                                { $toDouble: buyer.lng },
                                                180
                                              ]
                                          },
                                          3.141592653589793
                                        ]
                                      },
                                      {
                                        $multiply: [
                                          {
                                            $divide:
                                              [
                                                { $toDouble: "$coordinates.lng" },
                                                180
                                              ]
                                          },
                                          3.141592653589793
                                        ]
                                      }
                                    ]
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      ]
                    }
                  }
                ]
              },
              1
            ]
          }
        }
      }, {
        $sort: {
          distance: 1
        }
      },
      {

        $lookup: {

          from: "orders",
          let: { shopId: "$_id" },
          pipeline: [
            { $unwind: "$cart" },

            {
              $match: {
                $expr: {
                  $eq: ["$cart.shopId", "$$shopId"]
                },
                "cart.reviews.rate": { $gt: 0 }
              }
            },
            {
              $project: {
                reviewRate: "$cart.reviews.rate"
              }
            }
          ],
          as: "productReviews"
        }
      }, {
        '$addFields': {
          'averageRating': {
            '$avg': '$productReviews.reviewRate'
          },
          'totalReviews': {
            '$size': '$productReviews'
          }
        }
      },
      {
        $lookup: {

          from: "products",
          let: { shopId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$shopId", "$$shopId"] },
                    { $eq: ["$isPublish", true] }
                  ]
                }
              }
            },
            { $count: "count" }
          ],
          as: "productStats"

        }
      },
      {
        $addFields: {
          productCount: {
            $cond: [
              { $gt: [{ $size: "$productStats" }, 0] },
              {
                $arrayElemAt: ["$productStats.count", 0]
              },
              0
            ]
          }
        }
      }
    ]
    const shops = await Shop.aggregate(MQLBuilder);
    console.log('shops', shops);
    return shops;
  } catch (error) {
    padayon.ErrorHandler("Model::Category::getNearestShops", error, req, res);
  }
};


module.exports.getShopList = async (req, res) => {
  try {

    const MQLBuilder = [
      {
        '$project': {
          '_id': 1,
          'businessName': 1,
          'barangay': 1,
          'municipality': 1,
          'province': 1,
          'address': 1,
          'phoneNumber': 1,
          'documents': 1,
          'settlement_account': 1,
          'verification_process': 1,
          'coordinates': {
            'lat': '$coordinates.lat',
            'lng': '$coordinates.lng'
          }
        }
      }, {
        '$lookup': {
          'from': 'users',
          'let': {
            'shopId': '$_id'
          },
          'pipeline': [
            {
              '$match': {
                '$expr': {
                  '$eq': [
                    '$shop', '$$shopId'
                  ]
                }
              }
            }, {
              '$project': {
                '_id': 1,
                'firstname': 1,
                'lastname': 1,
                'email': 1
              }
            }
          ],
          'as': 'user'
        }
      }, {
        '$unwind': {
          'path': '$user',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$lookup': {
          'from': 'orders',
          'let': {
            'shopId': '$_id'
          },
          'pipeline': [
            {
              '$unwind': '$cart'
            }, {
              '$match': {
                '$expr': {
                  '$eq': [
                    '$cart.shopId', '$$shopId'
                  ]
                },
                'cart.reviews.rate': {
                  '$gt': 0
                }
              }
            }, {
              '$project': {
                'reviewRate': '$cart.reviews.rate'
              }
            }
          ],
          'as': 'productReviews'
        }
      }, {
        '$addFields': {
          'averageRating': {
            '$avg': '$productReviews.reviewRate'
          }
        }
      }
    ]

    //search 
    if (req.fnParams?.search) {
      let searchCriteria = {};
      searchCriteria['businessName'] = {
        $regex: req.fnParams?.search,
        $options: "i",
      };
      MQLBuilder.push({ $match: searchCriteria });
    }
    //end search

    //sort
    sortCriteria = {};
    sortCriteria[req.fnParams?.sort] = req.fnParams?.sortType;
    MQLBuilder.push({ $sort: sortCriteria });
    //end sort


    MQLBuilder.push(
      {
        $facet: {
          total: [
            {
              $count: "groups",
            },
          ],
          data: [
            {
              $addFields: {
                _id: "$_id",
              },
            },
          ],
        },
      },
      { $unwind: "$total" },
      {
        $project: {
          items: {
            $slice: [
              "$data",
              req.fnParams.skip * req.fnParams.limit,
              {
                $ifNull: [req.fnParams.limit, "$total.groups"],
              },
            ],
          },
          meta: {
            total: "$total.groups",
            limit: {
              $literal: req.fnParams.limit,
            },

            page: {
              $ceil: req.fnParams.skip / req.fnParams.limit + 1,
            },
            pages: {
              $ceil: {
                $divide: ["$total.groups", req.fnParams.limit],
              },
            },
          },
        },
      }
    );

    const shops = await Shop.aggregate(MQLBuilder);

    return shops;
  } catch (error) {
    padayon.ErrorHandler("Model::Category::getShopList", error, req, res);
  }
};




module.exports.getShop = async (req, res) => {
  try {
    const shopId = req.params.shopId || req.auth.shop._id;

    const MQLBuilder = [
      { $match: { _id: new mongoose.Types.ObjectId(shopId) } },
      {
        $project: {
          _id: 1,
          businessName: 1,
          coordinates: {
            lat: '$coordinates.lat',
            lng: '$coordinates.lng'
          },
          logo: 1,
          documents: 1,
          address: 1,
          province: 1,
          municipality: 1,
          barangay: 1,
          phoneNumber: 1,
          settlement_account: 1,
          verification_process: 1,

        }
      }];
    const shop = await Shop.aggregate(MQLBuilder);

    return shop;
  } catch (error) {
    padayon.ErrorHandler("Model::Category::getShop", error, req, res);
  }
};

module.exports.addShop = async (req, res) => {
  try {
    let response = {};
    const body = {
      businessName: req.fnParams.businessName,
      coordinates: req.fnParams.coordinates
    };

    const newShop = new Shop(body);
    const result = await newShop.save();

    response = result;
    return response;
  } catch (error) {
    padayon.ErrorHandler("Model::Shop::addShop", error, req, res);
  }
};

module.exports.saveAsDraftTab1 = async (req, res) => {
  try {
    const body = req.fnParams;
    const result = await Shop.updateOne(
      {
        _id: new mongoose.Types.ObjectId(body.shopId),
      },
      {
        $set: body.updateFields,
      },

    );

    response = result;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Shop::saveAsDraftTab1",
      error,
      req,
      res
    );
  }
}

module.exports.saveAsDraftTab2 = async (req, res) => {
  try {
    const body = req.fnParams;
    const result = await Shop.updateOne(
      {
        _id: new mongoose.Types.ObjectId(body.shopId),
      },
      {
        $set: {
          ...body
        },
      },

    );

    response = result;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Shop::saveAsDraftTab2",
      error,
      req,
      res
    );
  }
}

module.exports.saveAsDraftTab3 = async (req, res) => {
  try {
    const body = req.fnParams;
    const result = await Shop.updateOne(
      {
        _id: new mongoose.Types.ObjectId(body.shopId),
      },
      {
        $set: {
          settlement_account: { ...body }
        },
      },

    );

    response = result;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Shop::saveAsDraftTab3",
      error,
      req,
      res
    );
  }
}

module.exports.sendApplication = async (req, res) => {
  try {
    const body = req.fnParams;
    console.log('body', body)
    const result = await Shop.updateOne(
      {
        _id: new mongoose.Types.ObjectId(body.shopId),
      },
      {
        $set: {
          "verification_process.status": body.status,
          'verification_process.updatedAt': new Date()
        },
      },

    );
    console.log('result', result)
    response = result;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Shop::sendApplication",
      error,
      req,
      res
    );
  }
}

module.exports.declineApplication = async (req, res) => {
  try {
    const body = req.fnParams;
    console.log('body', body)
    const result = await Shop.updateOne(
      {
        _id: new mongoose.Types.ObjectId(body.shopId),
      },
      {
        $set: {
          "verification_process.status": body.status,
          'verification_process.errors.tab1': body.tab1,
          'verification_process.errors.tab2': body.tab2,
          'verification_process.errors.tab3': body.tab3,
          'verification_process.updatedAt': new Date()
        },
      },

    );
    console.log('result', result)
    response = result;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Shop::declineApplication",
      error,
      req,
      res
    );
  }
}

module.exports.approveApplication = async (req, res) => {
  try {
    const body = req.fnParams;
    console.log('body', body)
    const result = await Shop.updateOne(
      {
        _id: new mongoose.Types.ObjectId(body.shopId),
      },
      {
        $set: {
          "verification_process.status": body.status,

          'verification_process.updatedAt': new Date()
        },
      },

    );
    console.log('result', result)
    response = result;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Shop::approveApplication",
      error,
      req,
      res
    );
  }
}