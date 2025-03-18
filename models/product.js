"use_strict";
const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename).split(".").shift(),
  moment = require("moment-timezone"),
  mongoose = require("mongoose"),
  _ = require("lodash");

  Product = mongoose.model(
    base,
    mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId}, // 1-cashin 2-cashout
    name: { type: String,default: "" },
    category: [{ type: mongoose.Schema.Types.ObjectId,default: []}],
    images: [{ type: String,default: []}],
    expiryDate: { type: Date},
    qty: { type: String, default: "" },
    price: { type: Number, default: 0 }, 
    specialOffers: [{ type: String,default: []}],
    isDeleted: { type: Boolean, default: false },
   },
   { timestamps: true }
    )
    );

module.exports.getProducts = async (req, res) => {
    try {
      const skip = req.query.skip ? Number(req.query.skip) : 0;
      const limit = req.query.limit ? Number(req.query.limit) : 2;
      const radius = req.query.radius ? Number(req.query.radius) : 3;
      const search = req.query.search;
      const specialOffer = req.query.specialOffer;
      const categories = typeof req.query.categories == 'string' ? [req.query.categories] : req.query.categories;
      let sort = 'createdAt';
      let sortType = -1;
      const coordinates = {
        lat:req.auth.coordinates.lat,
        lon: req.auth.coordinates.lon
      }
      console.log('skip', typeof skip)
      console.log('req.query', req.query)
      switch (req.query.sort) {
        case 'nearest':
          sort = 'distance'
          sortType =  1
          break;
          case 'cheapest':
            sort = 'price'
            sortType = 1
          break;
      }
      
      const MQLBuilder = [
  
            {
              $match:
                {
                  qty: {
                    $gt: 0
                  }
                }
            },
            {
              '$unwind': {
                  'path': '$specialOffers', 
                  'preserveNullAndEmptyArrays': true
              }
          },
          {
            '$lookup': {
                'from': 'specialoffers', 
                'localField': 'specialOffers', 
                'foreignField': 'id', 
                'as': 'specialOffers'
            }
        },
        {
          '$unwind': {
              'path': '$specialOffers', 
              'preserveNullAndEmptyArrays': true
          }
      },
        {
          '$group': {
              '_id': '$_id', 
              'shopId': {
                  '$first': '$shopId'
              }, 
              'name': {
                  '$first': '$name'
              }, 
              'category': {
                  '$first': '$category'
              }, 
              'images': {
                  '$first': '$images'
              }, 
              'expiryDate': {
                  '$first': '$expiryDate'
              }, 
              'qty': {
                  '$first': '$qty'
              }, 
              'price': {
                  '$first': '$price'
              }, 
              'specialOffers': {
                  '$push': '$specialOffers'
              }, 
              'createdAt': {
                  '$first': '$createdAt'
              }, 
              'updatedAt': {
                  '$first': '$updatedAt'
              }, 
              'description': {
                  '$first': '$description'
              }
          }
      },
            {
              $lookup:
               
                {
                  from: "shop_reviews",
                  localField: "shopId",
                  foreignField: "shopId",
                  as: "ratings"
                }
            },
            {
              $lookup:
               
                {
                  from: "shops",
                  localField: "shopId",
                  foreignField: "_id",
                  as: "shop"
                }
            },
            {
              $unwind:
              
                {
                  path: "$shop"
                }
            },
            {
              $project:
               
                {
                  _id: 1,
                  shopId: 1,
                  name: 1,
                  category: 1,
                  images: 1,
                  expiryDate: 1,
                  qty: 1,
                  price: 1,
                  specialOffers: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  description: 1,
                  shop: 1,
                  rating: {
                    $round: [
                      {
                        $avg: "$ratings.rate"
                      },
                      1
                    ]
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
                                              coordinates.lat,
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
                                              "$shop.coordinates.lat",
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
                                              coordinates.lat,
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
                                              "$shop.coordinates.lat",
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
                                                        coordinates.lon,
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
                                                        "$shop.coordinates.lon",
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
              $set: {
                distance: { $toDouble: '$distance' },
              },
            },
          
      ];
  
      let searchCriteria = {};
      searchCriteria['name'] = {
        $regex: search,
        $options: "i",
      };
      if (search) MQLBuilder.push({ $match: searchCriteria });

      if (_.size(categories)) MQLBuilder.push({ $match: {category: { $in: categories } } } );
      
      if(req.query.storeRating)  MQLBuilder.push({ $match : { rating: { $gte: Number(req.query.storeRating) } } });
      
      if (specialOffer) MQLBuilder.push({  $match : { specialOffers : {"$elemMatch": { id: specialOffer } } } });
      if (radius) MQLBuilder.push({  $match : { distance : {$lte : radius} } });

      sortCriteria = {};
      sortCriteria[sort] = sortType;
      MQLBuilder.push({ $sort: sortCriteria });

     
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
                skip * limit,
                {
                  $ifNull: [limit, "$total.groups"],
                },
              ],
            },
            meta: {
              total: "$total.groups",
              limit: {
                $literal: limit,
              },
  
              page: {
               $ceil: skip / limit + 1  ,
              },
              pages: {
                $ceil: {
                  $divide: ["$total.groups", limit],
                },
              },
            },
          },
        }
      );

      const [products] = await Product.aggregate(MQLBuilder);
      
      return products;
    } catch (error) {
      padayon.ErrorHandler("Model::Product::getProducts", error, req, res);
    }
  };


  module.exports.getProduct = async (req, res) => {
    try {
      let prodId = req.params.id;
      
      const MQLBuilder = [
  
            {
              $match:
                {
                  _id: new mongoose.Types.ObjectId(prodId)
                }
            },
            {
              '$unwind': {
                  'path': '$specialOffers', 
                  'preserveNullAndEmptyArrays': true
              }
          },
          {
            '$lookup': {
                'from': 'specialoffers', 
                'localField': 'specialOffers', 
                'foreignField': 'id', 
                'as': 'specialOffers'
            }
        },
        {
          '$unwind': {
              'path': '$specialOffers', 
              'preserveNullAndEmptyArrays': true
          }
      },
        {
          '$group': {
              '_id': '$_id', 
              'shopId': {
                  '$first': '$shopId'
              }, 
              'name': {
                  '$first': '$name'
              }, 
              'category': {
                  '$first': '$category'
              }, 
              'images': {
                  '$first': '$images'
              }, 
              'expiryDate': {
                  '$first': '$expiryDate'
              }, 
              'qty': {
                  '$first': '$qty'
              }, 
              'price': {
                  '$first': '$price'
              }, 
              'specialOffers': {
                  '$push': '$specialOffers'
              }, 
              'createdAt': {
                  '$first': '$createdAt'
              }, 
              'updatedAt': {
                  '$first': '$updatedAt'
              }, 
              'description': {
                  '$first': '$description'
              }
          }
      },
            {
              $lookup:
               
                {
                  from: "shop_reviews",
                  localField: "shopId",
                  foreignField: "shopId",
                  as: "ratings"
                }
            },
            {
              $lookup:
               
                {
                  from: "shops",
                  localField: "shopId",
                  foreignField: "_id",
                  as: "shop"
                }
            },
            {
              $unwind:
              
                {
                  path: "$shop"
                }
            },
            {
              $project:
               
                {
                  _id: 1,
                  shopId: 1,
                  name: 1,
                  category: 1,
                  images: 1,
                  expiryDate: 1,
                  qty: 1,
                  price: 1,
                  specialOffers: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  description: 1,
                  shop: 1,
                  rating: {
                    $round: [
                      {
                        $avg: "$ratings.rate"
                      },
                      1
                    ]
                  },
                }
            }
      ];
  

      const [product] = await Product.aggregate(MQLBuilder);
      console.log('-------------product', product)
      return product;
    } catch (error) {
      padayon.ErrorHandler("Model::Product::getProduct", error, req, res);
    }
  };





