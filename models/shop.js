"use_strict";
const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename).split(".").shift(),
  moment = require("moment-timezone"),
  mongoose = require("mongoose");

  Shop = mongoose.model(
    base,
    mongoose.Schema({
    businessName: { type: String,default: "" },
    logo: { type: String,default: "" },
    documents: {
        bir: { type: String,default: "" },
        businessPermit: { type: String,default: "" }
    },
    address1: { type: String,default: "" },
    address2: { type: String,default: "" },
    coordinates: {
        lat: { type: Number,default: "" },
        lon: { type: Number,default: "" }
    },
   },
   { timestamps: true }
    )
    );

module.exports.getShops = async (req, res) => {
    try {
        const buyer = {
            lat:req.auth.coordinates.lat,
            lon: req.auth.coordinates.lon
          }

      const MQLBuilder = [
            { $project: {
                _id: 1,
                businessName: 1,
                coordinates: {
                    lat: '$coordinates.lat',
                    lon: '$coordinates.lon'
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
                                                buyer.lat,
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
                                              "$coordinates.lat",
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
                                                buyer.lat,
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
                                              "$coordinates.lat",
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
                                                        buyer.lon,
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
                                                        "$coordinates.lon",
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
            }}
        ]
      const shops = await Shop.aggregate(MQLBuilder);
   
      return shops;
    } catch (error) {
      padayon.ErrorHandler("Model::Category::getShops", error, req, res);
    }
  };





