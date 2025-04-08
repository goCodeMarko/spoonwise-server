"use_strict";
const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename).split(".").shift(),
  moment = require("moment-timezone"),
  userModel = require('./user'),
  productModel = require('./product'),
  mongoose = require("mongoose");

const LineItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    orderQty: { type: Number, default: 0 },
    images: [{ type: String, default: [] }],
    expiryDate: { type: Date },
    price: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    description: { type: String, default: "" },
    category: [{ type: String, default: [] }],
    specialOffers: [{ type: Object, default: [] }],
    status: [{
      status: { type: String, enum: ['ORDER_PENDING', 'ORDER_RECEIVED'], default: 'ORDER_PENDING' },  // 0 - order_pending, 1 - order_received, 2- refund , 3- cancel_by_buyer, 4 - cancel_by_seller,
      date: { type: Date, default: Date.now() },
    }
    ]
  }
);

Order = mongoose.model(
  base,
  mongoose.Schema(
    {
      buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      shops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
      paymentMethod: { type: String, default: 'ONLINE' }, // 1 - online, 2 - cash,
      shippingOption: { type: String, default: 'LALAMOVE' }, // 1 - lalamove, 2 - self_pickup, 3- meet_up
      cart: [
        {
          lineItems: [LineItemSchema],
          shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
          reviews: { rate: { type: Number, default: 0 }, comment: { type: String, default: '' }, date: { type: Date, default: Date.now() } },
          subtotal: { type: Number, default: 0 },
          totalItems: { type: Number, default: 0 },
          status: [{
            status: { type: String, default: 'TO_PAY' },  //1 - to_pay , 2 - for_review ,  3 - to_pack, 4 - for_pickup , 5 - to_receive, 6- buyer_canceled, 7 - seller_canceled,
            date: { type: Date, default: Date.now() }
          }],
          lalamove: [{
            quotationId: { type: String },
            priceBreakdown: {
              base: { type: String },
              surcharge: { type: String },
              totalExcludePriorityFee: { type: String },
              total: { type: String },
              currency: { type: String }
            },
            eventType: { type: String },
            eventVersion: { type: String },
            driver: [{
              orderId: { type: String },
              driverId: { type: String },
              phone: { type: String },
              name: { type: String },
              photo: { type: String },
              status: { type: String },
              plateNumber: { type: String },
              updatedAt: { type: String },
            }],
            shareLink: { type: String },
            scheduleAt: { type: String },
            market: { type: String },
            driverId: { type: String },
            previousStatus: { type: String },
            status: { type: String },
            distance: { value: { type: String }, unit: { type: String } },
            stops: [
              {
                coordinates: [{ lat: { type: String }, lng: { type: String } }],
                address: { type: String },
                name: { type: String },
                phone: { type: String },
                delivery_code: [{ type: mongoose.Schema.Types.Mixed }],
                id: { type: String }
              },
              {
                coordinates: [Object],
                address: { type: String },
                name: { type: String },
                phone: { type: String },
                POD: [{ type: mongoose.Schema.Types.Mixed }],
                delivery_code: [{ type: mongoose.Schema.Types.Mixed }],
                id: { type: String }
              }
            ],
            metadata: { internalId: { type: String } },
            id: { type: String }
          }]
        }
      ],
      totalPayment: { type: Number, default: 0 },
      invoice: {
        url: { type: String },
        id: { type: String },
        amount: { type: Number },
        status: { type: String },
        created: { type: Date },
        is_high: { type: Boolean },
        paid_at: { type: Date },
        updated: { type: Date },
        user_id: { type: String },
        currency: { type: String },
        payment_id: { type: String },
        description: { type: String },
        external_id: { type: String },
        paid_amount: { type: Number },
        ewallet_type: { type: String },
        merchant_name: { type: String },
        payment_method: { type: String },
        payment_channel: { type: String },
        payment_method_id: { type: String },
        success_redirect_url: { type: String }
      },
    },
    { timestamps: true }
  )
);

const prepareBulkProdQtyUpdate = async (cart, type) => {
  let bulkOps = cart.flatMap((shop) => { // Prepare bulk operations for updating product quantity
    return shop.lineItems.map((item) => ({
      updateOne: {
        filter: { _id: item.productId },
        update: {
          $inc: type === 'decrement' ? { qty: -item.orderQty } : { qty: item.orderQty }
        },
      },
    }))
  });
  console.log('-------------bulkOps', bulkOps)
  return bulkOps;
}


module.exports.checkout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction(); // ✅ Start transaction 
  try {
    let response = {};

    const order = new Order(req.body);
    const orderSave = await order.save();
    const removeCheckedCartLineItemsRes = await userModel.removeCheckedCartLineItems(req, res);
    const bulkUpdateProductQtyRes = await productModel.bulkUpdateProductQty(req, res);

    await session.commitTransaction(); // ✅ If all operations succeed, commit the transaction
    session.endSession();

    response = orderSave;
    return response;
  } catch (error) {
    await session.abortTransaction(); // ❌ If any operation fails, rollback the transaction
    session.endSession();

    padayon.ErrorHandler(
      "Model::Order::checkout",
      error,
      req,
      res
    );
  }
};

module.exports.updateOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction(); // ✅ Start transaction 
  try {
    let response = {};

    const result = await Order.findOneAndUpdate(
      { 'invoice.id': req.body.id },
      {
        $set: {
          'invoice': {
            'id': req.body.id,
            'external_id': req.body.external_id,
            'user_id': req.body.user_id,
            'payment_method': req.body.payment_method,
            'status': req.body.status,
            'merchant_name': req.body.merchant_name,
            'amount': req.body.amount,
            'paid_amount': req.body.paid_amount,
            'paid_at': req.body.paid_at,
            'description': req.body.description,
            'ewallet_type': req.body.ewallet_type,
            'is_high': req.body.is_high,
            'success_redirect_url': req.body.success_redirect_url,
            'created': req.body.created,
            'updated': req.body.updated,
            'currency': req.body.currency,
            'payment_channel': req.body.payment_channel,
            'payment_id': req.body.payment_id,
            'payment_method_id': req.body.payment_method_id
          }
        }
      },
      { new: true }
    )

    if (req.body.status == 'EXPIRED' && result) {

      req.bulkOps = await prepareBulkProdQtyUpdate(result.cart, 'increment');
      console.log('-------------------req.bulkOps', req.bulkOps)
      const bulkUpdateProductQtyRes = await productModel.bulkUpdateProductQty(req, res);
    }

    await session.commitTransaction(); // ✅ If all operations succeed, commit the transaction
    session.endSession();

    response = result;

    return response;
  } catch (error) {
    await session.abortTransaction(); // ❌ If any operation fails, rollback the transaction
    session.endSession();

    padayon.ErrorHandler(
      "Model::Order::updateOrder",
      error,
      req,
      res
    );
  }
};


module.exports.getOrders = async (req, res) => {
  try {
    let response = {};

    const matchStage = {};

    if (req.auth.role === "buyer") matchStage.buyer = new mongoose.Types.ObjectId(req.auth._id);
    else if (req.auth.role === "vendor") matchStage.vendor = new mongoose.Types.ObjectId(req.auth._id);


    const result = await Order.aggregate([
      {
        '$match': matchStage
      },
      {
        '$unwind': {
          'path': '$cart'
        }
      }, {
        '$unwind': {
          'path': '$cart.lineItems',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$addFields': {
          'cart.lineItems.latestStatus': {
            '$arrayElemAt': [
              {
                '$sortArray': {
                  'input': '$cart.lineItems.status',
                  'sortBy': {
                    '_id': -1
                  }
                }
              }, 0
            ]
          }
        }
      }, {
        '$group': {
          '_id': {
            'orderId': '$_id',
            'shopId': '$cart.shopId'
          },
          'orderId': {
            '$first': '$_id'
          },
          'shopId': {
            '$first': '$cart.shopId'
          },
          'buyer': {
            '$first': '$buyer'
          },
          'shops': {
            '$first': '$shops'
          },
          'paymentMethod': {
            '$first': '$paymentMethod'
          },
          'shippingOption': {
            '$first': '$shippingOption'
          },
          'createdAt': {
            '$first': '$createdAt'
          },
          'updatedAt': {
            '$first': '$updatedAt'
          },
          'invoice': {
            '$first': '$invoice'
          },
          'shopId': {
            '$first': '$cart.shopId'
          },
          'subtotal': {
            '$first': '$cart.subtotal'
          },
          'totalItems': {
            '$first': '$cart.totalItems'
          },
          'reviews': {
            $first: "$cart.reviews"
          },
          'status': {
            '$first': '$cart.status'
          },
          'cart': {
            '$push': '$cart.lineItems'
          }
        }
      }, {
        '$lookup': {
          'from': 'shops',
          'localField': 'shopId',
          'foreignField': '_id',
          'pipeline': [
            {
              '$project': {
                '_id': 1,
                'businessName': 1,
                'coordinates': 1,
                'logo': 1
              }
            }
          ],
          'as': 'shop'
        }
      }, {
        '$unwind': {
          'path': '$shop',
          'preserveNullAndEmptyArrays': true
        }
      }, {
        '$project': {
          '_id': 1,
          'orderId': 1,
          'shop': 1,
          'buyer': 1,
          'paymentMethod': 1,
          'shippingOption': 1,
          'cart': 1,
          'reviews': 1,
          'subtotal': 1,
          'totalItems': 1,
          'status': 1,
          'invoice': 1,
          'shippingOption': 1,
          'latestStatus': {
            '$arrayElemAt': [
              {
                '$sortArray': {
                  'input': '$status',
                  'sortBy': {
                    '_id': -1
                  }
                }
              }, 0
            ]
          }
        }
      }, {
        '$match': {
          'latestStatus.status': req.params.status.toUpperCase() == 'CANCELLED' ? { $in: ['BUYER_CANCELED', 'SELLER_CANCELED'] } : req.params.status.toUpperCase(),
          'invoice.status': { $ne: 'EXPIRED' },
        }
      },
      { $sort: { 'orderId': -1 } }
    ])

    response = result;
    console.log('--------------resultxxxxxxxx', result)
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Order::getOrders",
      error,
      req,
      res
    );
  }
};

module.exports.updateOrderStatus = async (req, res) => {
  try {
    let response = {};
    console.log('-----req.body', req.body)
    console.log('==========0')
    let matchStage = {
      '_id': new mongoose.Types.ObjectId(req.body.orderId),
      'cart.shopId': new mongoose.Types.ObjectId(req.body.shopId),
    }
    console.log('==========1')
    // if (!['BUYER_CANCELED', 'SELLER_CANCELED', ''].includes(req.body.status)) matchStage = { 'cart.lalamove.id': req.body.data.order.orderId };
    console.log('==========2')
    console.log('-----matchStage', matchStage)
    // if(!){
    //   matchStage = {
    //     '_id': new mongoose.Types.ObjectId(req.body.orderId),
    //     'cart.shopId': new mongoose.Types.ObjectId(req.body.shopId),
    //   }
    // }
    const updatedOrderStatus = await Order.findOneAndUpdate(
      matchStage,
      {
        $push: { 'cart.$.status': { status: req.body.status } }
      }
    );
    console.log('-------------updatedOrderStatus', req.body.shopId)
    console.log('-------------updatedOrderStatus', req.body.status)
    console.log('-------------updatedOrderStatus', updatedOrderStatus)
    if (['BUYER_CANCELED', 'SELLER_CANCELED'].includes(req.body.status)) {
      req.bulkOps = await prepareBulkProdQtyUpdate(updatedOrderStatus.cart, 'increment');
      const bulkUpdateProductQtyRes = await productModel.bulkUpdateProductQty(req, res);
    }

    response = updatedOrderStatus;

    return response;
  } catch (error) {
    console.log('----------error', error)
    padayon.ErrorHandler(
      "Model::Order::updateOrderStatus",
      error,
      req,
      res
    );
  }
};

module.exports.updateOrderLineItemStatus = async (req, res) => {
  try {
    let response = {};

    const updatedOrderLineItemStatus = await Order.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.body.orderId),
        "cart.shopId": new mongoose.Types.ObjectId(req.body.shopId),
        "cart.lineItems._id": new mongoose.Types.ObjectId(req.body.lineItemId)
      },
      {
        $push: { "cart.$[cartElem].lineItems.$[item].status": { status: req.body.status } }
      },
      {
        arrayFilters: [
          { "cartElem.shopId": new mongoose.Types.ObjectId(req.body.shopId) },
          { "item._id": new mongoose.Types.ObjectId(req.body.lineItemId) }
        ],
        new: true
      }
    );

    response = updatedOrderLineItemStatus;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Order::updateOrderLineItemStatus",
      error,
      req,
      res
    );
  }
};

module.exports.updateStoreReviews = async (req, res) => {
  try {
    let response = {};

    const updateStoreReviews = await Order.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.body.orderId),
        "cart.shopId": new mongoose.Types.ObjectId(req.body.shopId),
      },
      {
        $set: { "cart.$[cartElem].reviews": { rate: req.body.rating, comment: req.body.comment, date: new Date() } }
      },
      {
        arrayFilters: [
          { "cartElem.shopId": new mongoose.Types.ObjectId(req.body.shopId) },
        ],
        new: true
      }
    );

    response = updateStoreReviews;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Order::updateStoreReviews",
      error,
      req,
      res
    );
  }
};

module.exports.getShopReviews = async (req, res) => {
  try {
    console.log('req', req)
    const MQLBuilder = [
      {
        '$match': {
          'shops': {
            '$in': [
              new mongoose.Types.ObjectId(req.params.shopId)
            ]
          }
        }
      }, {
        '$unwind': {
          'path': '$cart'
        }
      },
      {
        '$match': {
          'cart.shopId': { $eq: new mongoose.Types.ObjectId(req.params.shopId) },
          'cart.reviews.rate': { $ne: 0 }
        }
      },
      {
        '$lookup': {
          'from': 'users',
          'localField': 'buyer',
          'foreignField': '_id',
          'pipeline': [
            {
              '$project': {
                '_id': 1,
                'firstname': 1,
                'lastname': 1
              }
            }
          ],
          'as': 'buyer'
        }
      }, {
        '$unwind': {
          'path': '$buyer'
        }
      },
      {
        $sort: {
          'cart.reviews.date': -1
        }
      },
      {
        '$project': {
          buyer: { $concat: ["$buyer.firstname", " ", { $concat: [{ $substrCP: ["$buyer.lastname", 0, 1] }, '.'] }] },
          rate: '$cart.reviews.rate',
          comment: '$cart.reviews.comment',
          date: '$cart.reviews.date'
        }
      }
    ];
    const reviews = await Order.aggregate(MQLBuilder);
    console.log('---------------reviews', reviews)
    return reviews;
  } catch (error) {
    padayon.ErrorHandler("Model::Order::getShopReviews", error, req, res);
  }
};


module.exports.getOrder = async (req, res) => {
  try {
    const MQLBuilder = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.query.orderId)
        }
      },
      {
        $project: {
          cart: {
            $filter: {
              input: "$cart", // The cart array
              as: "item",
              cond: { $eq: ["$$item.shopId", new mongoose.Types.ObjectId(req.query.shopId)] } // Only include cart items that match shopId
            }
          }
        }
      }
    ];
    const [order] = await Order.aggregate(MQLBuilder);
    console.log('---------------order', order)
    return order.cart;
  } catch (error) {
    padayon.ErrorHandler("Model::Order::getOrder", error, req, res);
  }
};


module.exports.addLalamoveDetails = async (req, res) => {
  try {
    let response = {};

    const result = await Order.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.assigningDriverData.metadata.orderId), 'cart.shopId': new mongoose.Types.ObjectId(req.assigningDriverData.metadata.shopId) },
      {
        $push: { 'cart.$.lalamove': req.assigningDriverData }
      },
      { new: true }
    )
    console.log('---------1111111111')
    response = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Order::addLalamoveDetails",
      error,
      req,
      res
    );
  }
};

module.exports.updateLalamoveDetails = async (req, res) => {
  try {
    console.log('-----------------updateLalamoveDetails', req.order)
    const updatedOrder = await Order.findOneAndUpdate(
      { 'cart.lalamove.id': req.order.orderId },  // Find order with matching lalamove.id
      {
        $set: {
          'cart.$[cartItem].lalamove.$[lalamoveItem].driverId': req.order.driverId,
          'cart.$[cartItem].lalamove.$[lalamoveItem].scheduleAt': req.order.scheduleAt,
          'cart.$[cartItem].lalamove.$[lalamoveItem].market': req.order.market,
          'cart.$[cartItem].lalamove.$[lalamoveItem].previousStatus': req.order.previousStatus,
          'cart.$[cartItem].lalamove.$[lalamoveItem].status': req.order.status,
        }
      },
      {
        arrayFilters: [
          { 'cartItem.shopId': new mongoose.Types.ObjectId(req.order.shopId) }, // Match cart item with correct shopId
          { 'lalamoveItem.id': req.order.orderId } // Match specific lalamove item
        ],
        new: true
      }
    );
    console.log('ertreit', req.message)
    if (req.isToUpdateShopOrderStatus) await this.updateOrderStatus(req, res);


    return updatedOrder;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Order::updateLalamoveDetails",
      error,
      req,
      res
    );
  }
};

module.exports.addDriverToLalamoveDetails = async (req, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { 'cart.lalamove.id': req.driver.orderId }, // Find cart with matching Lalamove orderId
      {
        $push: { 'cart.$[].lalamove.$[lalamoveItem].driver': req.driver } // Push driver to matching Lalamove entry
      },
      {
        arrayFilters: [{ 'lalamoveItem.id': req.driver.orderId }], // Filter correct lalamove object
        new: true
      }
    );

    return updatedOrder;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Order::addDriverToLalamoveDetails",
      error,
      req,
      res
    );
  }
};