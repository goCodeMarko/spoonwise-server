"use_strict";
const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename).split(".").shift(),
  moment = require("moment-timezone"),
  mongoose = require("mongoose");
  
  const LineItemSchema = new mongoose.Schema(
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String },
      orderQty: { type: Number, default: 0 },
      images: [{ type: String,default: []}],
      expiryDate: { type: Date},
      price: { type: Number, default: 0 }, 
      description: { type: String,default: "" },
      category: [{ type: String,default: []}],
      specialOffers: [{ type: Object,default: []}],
      status: [ {
            status : { type: Number, default: 0 },  // 0 - none, 1 - order_received, 2- refund , 3- cancel_by_buyer, 4 - cancel_by_seller,
            date: { type: Date, default: Date.now()},
            }
        ] 
    }
  );

  Order = mongoose.model(
    base,
    mongoose.Schema(
      {
        buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        paymentMethod:  { type: Number, default: 1}, // 1 - online, 2 - cash,
        shippingOption: {type: Number, default: 1 }, // 1 - lalamove, 2 - self_pickup
        cart: [
            { 
              lineItems: [ LineItemSchema ],
              shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
              subtotal: { type: Number, default: 0},
              totalItems: { type: Number, default: 0},
              status: [ {
                status: { type: Number, default: 1},  //1 - to_pay , 2 - to_review ,  3 - to_pack, 4 - ready_for_pickup , 5 - to_receive, 6- cancel_by_buyer, 7 - cancel_by_seller,
                date: { type: Date, default: Date.now()} 
              } ]
            }
          ],
        totalPayment: { type: Number, default: 0},
        invoice: {
            url: { type: String },
            id: { type: String },
            amount: { type: Number },
            status:  { type: String },
            created: { type: Date } ,
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
            }
        },
        { timestamps: true }
    )
  );

module.exports.checkout = async (req, res) => {
  try {
    let response = {};
    console.log('------------------   req.body',    req.body)
    const order = new Order(req.body);
    const result = await order.save();

    // Execute all updates in one query
    if (req.bulkOps.length > 0) await Product.bulkWrite(req.bulkOps);
      
    response = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Model::Order::checkout",
      error,
      req,
      res
    );
  }
}; 

module.exports.updateOrder = async (req, res) => {
    try {
      let response = {};

      const result = await Order.findOneAndUpdate(
        { 'invoice.id' : req.body.id},
        { $set: { 'invoice': {
            'id': req.body.id,
            'external_id': req.body.external_id,
            'user_id': req.body.user_id,
            'payment_method': req.body.payment_method,
            'status': req.body.status,
            'merchant_name': req.body.merchant_name,
            'amount':req.body.amount,
            'paid_amount':req.body.paid_amount,
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
        } } },
        { new: true }
        )

      response = result;
  
      return response;
    } catch (error) {
      padayon.ErrorHandler(
        "Model::Order::updateOrder",
        error,
        req,
        res
      );
    }
  }; 


