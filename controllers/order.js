const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename, ".js"),
  _ = require("lodash"),
  model = require(`./../models/${base}`),
  { ObjectId } = require("mongodb"),
  { Invoice } = require('xendit-node'),
  userController = require("./user"),
  productController = require("./product"),
  shopController = require("./shop"),
  SDKClient = require('@lalamove/lalamove-js'),
  lalamoveClient = new SDKClient.ClientModule(
    new SDKClient.Config(
      process.env.LALAMOVE_PUBLIC_KEY,
      process.env.LALAMOVE_SECRET_KEY,
      "sandbox"
    )
  ),
  mongoose = require("mongoose"),
  invoiceClient = new Invoice({ secretKey: process.env.XENDIT_SECRET });

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

  return bulkOps;
}

module.exports.checkout = async (req, res) => {
  try {
    let response = { success: true, code: 201 };


    const externalId = padayon.uniqueXenditExternalId();

    let xedit;
    if (req.body.paymentMethod == 'ONLINE') {
      xedit = await invoiceClient.createInvoice({
        data: {
          "amount": req.body.totalPayment,
          "invoiceDuration": 180,
          "externalId": externalId,
          "description": "Test Invoice",
          "currency": "PHP",
          "reminderTime": 1,
          "successRedirectUrl": 'http://localhost:4888'
        }
      });
    }

    let cart = req.body.cart.map((shop) => ({
      ...shop,
      shopId: shop.shop.shopId,
      status: [{ status: 'TO_PAY' }], // Add status to each shop
      lineItems: shop.lineItems.map((item) => ({
        ...item,
        status: [{ status: 'ORDER_PENDING' }] // Add status to each line item
      })),
    }));
    let shops = cart.map(shop => shop.shop.shopId);

    req.body = {
      buyer: req.auth._id,
      shops,
      cart: cart,
      paymentMethod: req.body.paymentMethod,
      shippingOption: req.body.shippingOption,
      totalPayment: req.body.totalPayment,
    }

    if (req.body.paymentMethod === 'ONLINE') {
      req.body.invoice = {
        "id": xedit.id,
        "amount": xedit.amount,
        "status": xedit.status,
        "external_id": xedit.externalId,
        "created": xedit.created,
        "updated": xedit.updated,
        "currency": xedit.currency,
        "description": xedit.description,
        "url": xedit.invoiceUrl,
      }
    }
    console.log('--------2')
    req.bulkOps = await prepareBulkProdQtyUpdate(cart, 'decrement');

    const checkoutRes = await model.checkout(req, res);

    response.data = checkoutRes;
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
    const token = req.headers["x-callback-token"];

    if (token !== process.env.XENDIT_CALLBACK_TOKEN) throw new padayon.UnauthorizedException("Unauthorized");

    let result = await model.updateOrder(req, res);

    response.data = result;
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::webhookXenditInvoice",
      error,
      req,
      res
    );
  }
};

module.exports.getOrders = async (req, res) => {
  try {
    let response = { success: true, code: 201 };

    const result = await model.getOrders(req, res);


    response.data = result;
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::getOrders",
      error,
      req,
      res
    );
  }
}

module.exports.updateOrderStatus = async (req, res) => {
  try {
    let response = { success: true, code: 201 };

    const result = await model.updateOrderStatus(req, res);


    response.data = result;
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::updateOrderStatus",
      error,
      req,
      res
    );
  }
}

module.exports.updateOrderLineItemStatus = async (req, res) => {
  try {
    let response = { success: true, code: 201 };

    const result = await model.updateOrderLineItemStatus(req, res);


    response.data = result;
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::updateOrderLineItemStatus",
      error,
      req,
      res
    );
  }
}

module.exports.updateStoreReviews = async (req, res) => {
  try {
    let response = { success: true, code: 201 };

    const result = await model.updateStoreReviews(req, res);


    response.data = result;
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::updateStoreReviews",
      error,
      req,
      res
    );
  }
}

module.exports.getShopReviews = async (req, res) => {
  try {
    let response = { success: true, code: 201 };

    const result = await model.getShopReviews(req, res);


    response.data = result;
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::getShopReviews",
      error,
      req,
      res
    );
  }
}


generateQuotation = async (req, res) => {
  const shop = await shopController.getShop(req, res);

  if (!_.size(shop.data)) throw new padayon.BadRequestException("Shop Not Found");

  const quotationPayload = SDKClient.QuotationPayloadBuilder.quotationPayload()
    .withLanguage("en_PH")
    .withServiceType("MOTORCYCLE")
    .withStops([
      { coordinates: { lat: "" + shop.data[0].coordinates.lat, lng: "" + shop.data[0].coordinates.lon }, address: shop.data[0].address1 + " " + shop.data[0].address2 },
      { coordinates: { lat: "" + req.auth.coordinates.lat, lng: "" + req.auth.coordinates.lon }, address: req.auth.address1 + " " + req.auth.address2 }
    ]).build();

  const quotation = await lalamoveClient.Quotation.create("PH", quotationPayload);
  console.log('----------------quotation', quotation)
  return quotation;
}

module.exports.lalamoveGetQuotation = async (req, res) => {
  try {
    let response = { success: true, code: 201, };
    const [order] = await model.getOrder(req, res);
    const lalamove = _.last(order.lalamove);
    let lalamoveStatus = '';
    let quotation = {};
    let latestLalamoveOrder = {};
    let latestLalamoveDriver = {};

    console.log('------------order', order)
    if (_.size(lalamove) == 0) {
      console.log('No Existing Lalamove order')
      lalamoveStatus = 'NONE';
      quotation = await generateQuotation(req, res);
    } else if (_.has(order, 'lalamove') && ((lalamove.status == 'EXPIRED') || (lalamove.status == 'CANCELED') || (lalamove.status == 'REJECTED'))) {
      console.log('It has lalamove object but need to push new qoutation')
      lalamoveStatus = 'EXPIRED_CANCELED_REJECTED';
      quotation = await generateQuotation(req, res);
    } else if (_.has(order, 'lalamove') && (lalamove.status == 'ASSIGNING_DRIVER')) {
      lalamoveStatus = 'ASSIGNING_DRIVER';
      latestLalamoveOrder = await lalamoveClient.Order.retrieve("PH", lalamove.id);
    } else if (_.has(order, 'lalamove') && (lalamove.status == 'ON_GOING')) {
      lalamoveStatus = 'ON_GOING';
      latestLalamoveOrder = await lalamoveClient.Order.retrieve("PH", lalamove.id);
      latestLalamoveDriver = _.last(lalamove.driver)
    } else if (_.has(order, 'lalamove') && (lalamove.status == 'PICKED_UP')) {
      lalamoveStatus = 'PICKED_UP';
      latestLalamoveOrder = await lalamoveClient.Order.retrieve("PH", lalamove.id);
      latestLalamoveDriver = _.last(lalamove.driver)
    } else if (_.has(order, 'lalamove') && (lalamove.status == 'COMPLETED')) {
      lalamoveStatus = 'COMPLETED';
      latestLalamoveOrder = await lalamoveClient.Order.retrieve("PH", lalamove.id);
      latestLalamoveDriver = _.last(lalamove.driver)
    }
    console.log('-----latestLalamoveDriver', latestLalamoveDriver)
    response.data = { lalamoveStatus, quotation, latestLalamoveOrder, latestLalamoveDriver };
    return response;

  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::lalamoveGetQuotation",
      error,
      req,
      res
    );
  }
}



module.exports.lalamoveCreateOrder = async (req, res) => {
  try {
    let response = { success: true, code: 201 };
    req.query.shopId = req.body.shopId;
    req.query.orderId = req.body.orderId;
    const order = await model.getOrder(req, res);
    const shop = await shopController.getShop(req, res);

    if (!_.size(shop.data)) throw new padayon.BadRequestException("Shop Not Found");
    if (!_.size(order)) throw new padayon.BadRequestException("Order Not Found");

    let remarks = 'Please pick-up the product(s): ';
    order[0].lineItems.forEach(lineitem => {
      remarks += ` [x${lineitem.orderQty} ${lineitem.name}]`
    })
    remarks += ` Thank you po!`


    const orderPayload = SDKClient.OrderPayloadBuilder.orderPayload()
      .withQuotationID(req.body.quotation.id)
      .withSender({
        stopId: req.body.quotation.stops[0].id,
        name: shop.data[0].businessName,
        phone: shop.data[0].phoneNumber,
      })
      .withRecipients([
        {
          stopId: req.body.quotation.stops[1].id,
          name: req.auth.fullname,
          phone: req.auth.phoneNumber,
          remarks
        },
      ])
      .withMetadata({
        "orderId": req.body.orderId,
        "shopId": req.body.shopId,
      })
      .build();

    const lalamoveOrder = await lalamoveClient.Order.create('PH', { ...orderPayload, paymentMethod: "CASH" })

    response.data = lalamoveOrder;
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::lalamoveCreateOrder",
      error,
      req,
      res
    );
  }
}

module.exports.lalamoveStopFindingDrivers = async (req, res) => {
  try {
    let response = { success: true, code: 201 };

    const stopFinding = await lalamoveClient.Order.cancel("PH", req.body.lalamoveOrder.id);
    console.log('-----------stopFinding', stopFinding)
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::lalamoveStopFindingDrivers",
      error,
      req,
      res
    );
  }
}

module.exports.getOrder = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const result = await model.getOrder(req, res);
    response.data = result;

    // if (_.size(result) === 0) {
    //   response.data = [];
    // }

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::getOrder",
      error,
      req,
      res
    );
  }
};

module.exports.webhookLalamove = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    console.log('-----------webhookLalamovexxxxxxxx', req.body)

    if (req.body.eventType == 'ORDER_STATUS_CHANGED') {
      const body = req.body.data;

      if (body.order.status == 'ASSIGNING_DRIVER' && (body.order.previousStatus == '' || ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(body.order.previousStatus))) {
        console.log('status-----------------ASSIGNING_DRIVER')
        const orderFullDetails = await lalamoveClient.Order.retrieve("PH", body.order.orderId);

        req.assigningDriverData = {
          quotationId: orderFullDetails.quotationId,
          priceBreakdown: orderFullDetails.priceBreakdown,
          eventType: body.eventType,
          eventVersion: body.eventVersion,
          driver: [],
          scheduleAt: '',
          market: '',
          driverId: '',
          previousStatus: '',
          shareLink: orderFullDetails.shareLink,
          status: orderFullDetails.status,
          distance: orderFullDetails.distance,
          stops: orderFullDetails.stops,
          metadata: orderFullDetails.metadata,
          id: body.order.orderId
        }

        const addLalamoveDetails = await model.addLalamoveDetails(req, res);

      } else if (body.order.status == 'ON_GOING' && body.order.previousStatus == 'ASSIGNING_DRIVER') {
        const orderFullDetails = await lalamoveClient.Order.retrieve("PH", body.order.orderId);

        req.order = {
          shopId: orderFullDetails.metadata.shopId,
          orderId: body.order.orderId,
          driverId: body.order.driverId,
          scheduleAt: body.order.scheduleAt,
          previousStatus: body.order.previousStatus,
          market: body.order.market,
          status: body.order.status,
        }

        const updateLalamoveDetails = await model.updateLalamoveDetails(req, res);
      } else if (body.order.status == 'PICKED_UP' && body.order.previousStatus == 'ON_GOING') {
        const orderFullDetails = await lalamoveClient.Order.retrieve("PH", body.order.orderId);

        req.order = {
          shopId: orderFullDetails.metadata.shopId,
          orderId: body.order.orderId,
          driverId: body.order.driverId,
          scheduleAt: body.order.scheduleAt,
          previousStatus: body.order.previousStatus,
          market: body.order.market,
          status: body.order.status,
        }

        console.log('--------orderFullDetails2222', orderFullDetails)
        req.isToUpdateShopOrderStatus = true;
        req.body.shopId = orderFullDetails.metadata.shopId;
        req.body.orderId = orderFullDetails.metadata.orderId;
        req.body.status = 'TO_RECEIVE';
        const updateLalamoveDetails = await model.updateLalamoveDetails(req, res);
      } else if (((body.order.status == 'ASSIGNING_DRIVER' || body.order.status == 'REJECTED') && body.order.previousStatus == 'ON_GOING') || body.order.status == 'EXPIRED' && body.order.previousStatus == 'ASSIGNING_DRIVER') {
        const orderFullDetails = await lalamoveClient.Order.retrieve("PH", body.order.orderId);

        req.order = {
          shopId: orderFullDetails.metadata.shopId,
          orderId: body.order.orderId,
          driverId: '',
          scheduleAt: '',
          previousStatus: body.order.previousStatus,
          market: '',
          status: body.order.status,
        }

        const updateLalamoveDetails = await model.updateLalamoveDetails(req, res);
      } else if (body.order.status == 'EXPIRED' && body.order.previousStatus == 'ASSIGNING_DRIVER') {
        const orderFullDetails = await lalamoveClient.Order.retrieve("PH", body.order.orderId);

        req.order = {
          shopId: orderFullDetails.metadata.shopId,
          orderId: body.order.orderId,
          driverId: '',
          scheduleAt: '',
          previousStatus: body.order.previousStatus,
          market: '',
          status: body.order.status,
        }

        const updateLalamoveDetails = await model.updateLalamoveDetails(req, res);
      } else if (body.order.status == 'CANCELED' && body.order.previousStatus == 'PICKED_UP') {
        const orderFullDetails = await lalamoveClient.Order.retrieve("PH", body.order.orderId);

        req.order = {
          shopId: orderFullDetails.metadata.shopId,
          orderId: body.order.orderId,
          driverId: '',
          scheduleAt: '',
          previousStatus: body.order.previousStatus,
          market: '',
          status: body.order.status,
        }

        req.isToUpdateShopOrderStatus = true;
        req.body.shopId = orderFullDetails.metadata.shopId;
        req.body.status = 'FOR_DELIVERY';
        const updateLalamoveDetails = await model.updateLalamoveDetails(req, res);
      } else if (body.order.status == 'CANCELED') {
        const orderFullDetails = await lalamoveClient.Order.retrieve("PH", body.order.orderId);

        req.order = {
          shopId: orderFullDetails.metadata.shopId,
          orderId: body.order.orderId,
          driverId: '',
          scheduleAt: '',
          previousStatus: body.order.previousStatus,
          market: '',
          status: body.order.status,
        }

        const updateLalamoveDetails = await model.updateLalamoveDetails(req, res);
      } else if (body.order.status == 'COMPLETED') {
        console.log('----------------completed')
        const orderFullDetails = await lalamoveClient.Order.retrieve("PH", body.order.orderId);

        req.order = {
          shopId: orderFullDetails.metadata.shopId,
          orderId: body.order.orderId,
          driverId: body.order.driverId,
          scheduleAt: body.order.scheduleAt,
          previousStatus: body.order.previousStatus,
          market: body.order.market,
          status: body.order.status,
        }
        req.isToUpdateShopOrderStatus = true;
        req.body.shopId = orderFullDetails.metadata.shopId;
        req.body.status = 'TO_RECEIVE';
        const updateLalamoveDetails = await model.updateLalamoveDetails(req, res);
      }
    }

    if (req.body.eventType == 'DRIVER_ASSIGNED') {
      console.log('eventType-----------------DRIVER_ASSIGNED', req.body)

      req.driver = {
        orderId: req.body.data.order.orderId,
        driverId: req.body.data.driver.driverId,
        phone: req.body.data.driver.phone,
        name: req.body.data.driver.name,
        photo: req.body.data.driver.photo,
        plateNumber: req.body.data.driver.plateNumber,
        status: req.body.eventType,
        updatedAt: req.body.data.updatedAt,
      }


      const addDriverToLalamoveDetails = await model.addDriverToLalamoveDetails(req, res);
    }

    // const token = req.headers["x-callback-token"];

    // if (token !== process.env.XENDIT_CALLBACK_TOKEN) throw new padayon.UnauthorizedException("Unauthorized");

    // let result = await model.updateOrder(req, res);

    // response.data = result;
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::Order::webhookLalamove",
      error,
      req,
      res
    );
  }
};