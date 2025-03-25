const padayon = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    _ = require("lodash"),
    model = require(`./../models/${base}`),
   { ObjectId } = require("mongodb"),
   { Invoice } = require('xendit-node'),
   userController = require("./user"),
   invoiceClient = new Invoice({ secretKey: process.env.XENDIT_SECRET });



module.exports.checkout = async (req, res) => {
  try {
    let response = { success: true, code: 201 };
 
    const xedit = await invoiceClient.createInvoice({
        data: {
        "amount" : req.body.totalPayment,
        "invoiceDuration" : 172800,
        "externalId" : "test1234",
        "description" : "Test Invoice",
        "currency" : "PHP",
        "reminderTime" : 1,
        "successRedirectUrl": 'http://localhost:4888'
    }});

     // Prepare bulk operations for updating product quantity
     const bulkOps = req.body.cart.flatMap((shop) =>
        shop.lineItems.map((item) => ({
          updateOne: {
            filter: { _id: item.productId },
            update: { $inc: { qty: -item.orderQty } }, 
          },
        }))
    );
    console.log("🚀 BulkOps: ", JSON.stringify(bulkOps, null, 2));

    req.bulkOps = bulkOps;
    req.body = {
        buyer: req.auth._id,
        cart: req.body.cart,
        totalPayment: req.body.totalPayment,
        invoice: {
            "id": xedit.id,
            "amount": xedit.amount,
            "status":  xedit.status,
            "created": xedit.created,
            "updated": xedit.updated,
            "currency": xedit.currency,
            "description": xedit.description,
            "url": xedit.invoiceUrl,
        }
    }
    console.log('------------------   req.body',    req.body)
    await userController.removeCheckedCartLineItems(req, res);
    const result = await model.checkout(req, res);

    response.data = result;
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::checkout",
      error,
      req,
      res
    );
  }
}; 

module.exports.webhookXenditInvoice = async (req, res) => {
    try {
      let response = { success: true, code: 201 };
        
      const result = await model.updateOrder(req, res);

  
      response.data = result;
      return response;
    } catch (error) {
      padayon.ErrorHandler(
        "Controller::Order::checkout",
        error,
        req,
        res
      );
    }
  }; 