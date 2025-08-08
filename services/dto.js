const Joi = require("joi");

module.exports.bookDTO = Joi.object({
  title: Joi.string().required().messages({
    "string.base": `"title" should be a type of "string"`,
    "string.empty": `"title" cannot be an empty field`,
  }),
  author: Joi.string().required().messages({
    "string.base": `"author" should be a type of "string"`,
    "string.empty": `"author" cannot be an empty field`,
  }),
  price: Joi.number().required().messages({
    "number.base": `"price" should be a type of "number"`,
    "number.empty": `"price" cannot be an empty field`,
  }),
  stocks: Joi.number().integer().required().messages({
    "number.base": `"stocks" should be a type of "number"`,
    "number.empty": `"stocks" cannot be an empty field`,
  }),
});

module.exports.userAccessDTO = Joi.object({
  isallowedtodelete: Joi.boolean().required().messages({
    "boolean.base": `"isallowedtodelete" should be a type of "boolean"`,
    "boolean.empty": `"isallowedtodelete" cannot be an empty field`,
  }),
  isallowedtocreate: Joi.boolean().required().messages({
    "boolean.base": `"isallowedtocreate" should be a type of "boolean"`,
    "boolean.empty": `"isallowedtocreate" cannot be an empty field`,
  }),
  isallowedtoupdate: Joi.boolean().required().messages({
    "boolean.base": `"isallowedtoupdate" should be a type of "boolean"`,
    "boolean.empty": `"isallowedtoupdate" cannot be an empty field`,
  }),
  isblock: Joi.boolean().required().messages({
    "boolean.base": `"isblock" should be a type of "boolean"`,
    "boolean.empty": `"isblock" cannot be an empty field`,
  }),
});

module.exports.cashoutDTO = Joi.object({
  type: Joi.number().min(1).max(2).required().messages({
    "number.base": `Type should be a type of number`,
  }),
  snapshot: Joi.string().required().messages({
    "string.base": `Snapshot should be a type of string`,
    "satring.empty": `Snapshot cannot be an empty field`,
  }),
  amount: Joi.number().required().messages({
    "number.base": `Amount should be a type of number`,
    "number.empty": `Amount cannot be an empty field`,
  }),
  fee: Joi.number().required().messages({
    "number.base": `Fee should be a type of number`,
    "number.empty": `Fee cannot be an empty field`,
  }),
  fee_payment_is_gcash: Joi.boolean().required().messages({
    "number.base": `Fee payment type should be a type of boolean`,
    "number.empty": `Fee payment type cannot be an empty field`,
  }),
  note: Joi.allow("").optional().messages({
    "string.base": `Note should be a type of string`,
  }),
  trans_id: Joi.string().disallow(null).required().messages({
    "string.base": `Transaction id should be a type of string`,
    "string.empty": `Transaction id cannot be an empty`,
    "string.disallow": "Transaction id cannot be an empty",
  }),
});

module.exports.cashinDTO = Joi.object({
  type: Joi.number().min(1).max(2).required().messages({
    "number.base": `Type should be a type of number`,
  }),
  amount: Joi.number().required().messages({
    "number.base": `Amount should be a type of number`,
    "number.empty": `Amount cannot be an empty field`,
  }),
  phone_number: Joi.string()
    .regex(/^09\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": `Phone number format should be like this 09XXXXXXXXXX`,
      "string.empty": `Phone number cannot be an empty field`,
    }),
  fee: Joi.number().required().messages({
    "number.base": `Fee should be a type of number`,
    "number.empty": `Fee cannot be an empty field`,
  }),
  fee_payment_is_gcash: Joi.boolean().required().messages({
    "number.base": `Fee payment type should be a type of boolean`,
    "number.empty": `Fee payment type cannot be an empty field`,
  }),
  note: Joi.allow("").optional().messages({
    "string.base": `Note should be a type of string`,
  }),
  trans_id: Joi.string().disallow(null).required().messages({
    "string.base": `Transaction id should be a type of string`,
    "string.empty": `Transaction id cannot be an empty`,
    "string.disallow": "Transaction id cannot be an empty",
  }),
});

module.exports.updateTransactionStatusDTO = Joi.object({
  type: Joi.number().min(1).max(2).required().messages({
    "number.base": `Type should be a type of number`,
  }),
  status: Joi.number().disallow(null).required().messages({
    "number.base": `Status should be a type of number`,
    "number.empty": `Status cannot be an empty`,
    "number.disallow": "Status cannot be an empty",
  }),
  trans_id: Joi.string().disallow(null).required().messages({
    "string.base": `Transaction id should be a type of string`,
    "string.empty": `Transaction id cannot be an empty`,
    "string.disallow": "Transaction id cannot be an empty",
  }),
  cid: Joi.string().disallow(null).required().messages({
    "string.base": `Cash id should be a type of string`,
    "string.empty": `Cash id cannot be an empty`,
    "string.disallow": "Cash id cannot be an empty",
  }),
});

module.exports.approveCashinDTO = Joi.object({
  type: Joi.number().min(1).max(2).required().messages({
    "number.base": `Type should be a type of number`,
  }),
  status: Joi.number().disallow(null).required().messages({
    "number.base": `Status should be a type of number`,
    "number.empty": `Status cannot be an empty`,
    "number.disallow": "Status cannot be an empty",
  }),
  trans_id: Joi.string().disallow(null).required().messages({
    "string.base": `Transaction id should be a type of string`,
    "string.empty": `Transaction id cannot be an empty`,
    "string.disallow": "Transaction id cannot be an empty",
  }),
  cid: Joi.string().disallow(null).required().messages({
    "string.base": `Cash id should be a type of string`,
    "string.empty": `Cash id cannot be an empty`,
    "string.disallow": "Cash id cannot be an empty",
  }),
  screenshot: Joi.string().disallow(null).required().messages({
    "string.base": `Screenshot should be a type of string`,
    "string.empty": `Screenshot cannot be an empty`,
  }),
});

module.exports.createTransactionDTO = Joi.object({
  date: Joi.date().required().iso().messages({
    "date.base": `Date should be a type of iso`,
    "date.empty": `Date cannot be an empty`,
  }),
  gcash: Joi.number().disallow(null).required().messages({
    "number.base": `Gcash should be a type of number`,
    "number.empty": `Gcash cannot be an empty`,
    "number.disallow": "Gcash cannot be an empty",
  }),
  cash_on_hand: Joi.number().disallow(null).required().messages({
    "number.base": `Gcash should be a type of number`,
    "number.empty": `Gcash cannot be an empty`,
    "number.disallow": "Gcash cannot be an empty",
  }),
  gcashNumber: Joi.string()
    .regex(/^09\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": `Phone number format should be like this 09XXXXXXXXXX`,
      "string.empty": `Phone number cannot be an empty field`,
    }),
  cashout: Joi.array().items(Joi.string()).empty(),
  cashin: Joi.array().items(Joi.string()).empty(),
});


module.exports.userDTO = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": `"email" should be a type of "email"`,
    "string.empty": `"email" cannot be an empty field`,
  }),
  password: Joi.string().required().messages({
    "number.base": `"password" should be a type of "string"`,
    "number.empty": `"password" cannot be an empty field`,
  }),
});

const objectIdPattern = /^[0-9a-fA-F]{24}$/;
module.exports.addUserDTO = Joi.object({
  email: Joi.string().email().required().messages({
    "string.base": `"email" should be a type of "email"`,
    "string.empty": `"email" cannot be an empty field`,
  }),
  password: Joi.string().required().messages({
    "number.base": `"password" should be a type of "string"`,
    "number.empty": `"password" cannot be an empty field`,
  }),
  firstname: Joi.string().required().messages({
    "string.base": `"First Name" should be a type of "string"`,
    "string.empty": `"First Name" cannot be an empty field`,
  }),
  lastname: Joi.string().required().messages({
    "string.base": `"Last Name" should be a type of "string"`,
    "string.empty": `"Last Name" cannot be an empty field`,
  }),
  role: Joi.string().required().messages({
    "string.base": `"Role" should be a type of "string"`,
    "string.empty": `"Role" cannot be an empty field`,
  }),
  shop: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": `"Shop" must be a valid MongoDB ObjectId`,
    "string.base": `"Shop" should be a type of "string"`,
    "string.empty": `"Shop" cannot be an empty field`,
  }),
  shop: Joi.any().optional().messages({
    "any.required": `"Shop" is required`,
  })
});


module.exports.saveAsDraftTab2DTO = Joi.object({
  coordinates: Joi.object({
    lat: Joi.string().required().messages({
      "string.base": `"Latitude" should be a type of "string"`,
      "string.empty": `"Latitude" cannot be an empty field`,
      "any.required": `"Latitude" is required`
    }),
    lng: Joi.string().required().messages({
      "string.base": `"Longitude" should be a type of "string"`,
      "string.empty": `"Longitude" cannot be an empty field`,
      "any.required": `"Longitude" is required`
    }),
  }).required().messages({
    "object.base": `"Coordinates" must be an object`,
    "any.required": `"Coordinates" field is required`,
  }),

  province: Joi.string().optional().messages({
    "string.base": `"Province" must be a string`,
    "string.empty": `"Province" cannot be an empty field`,
    "any.required": `"Province" is required`
  }),

  municipality: Joi.string().optional().messages({
    "string.base": `"Municipality" must be a string`,
    "string.empty": `"Municipality" cannot be an empty field`,
    "any.required": `"Municipality" is required`
  }),

  barangay: Joi.string().optional().messages({
    "string.base": `"Barangay" must be a string`,
    "string.empty": `"Barangay" cannot be an empty field`,
    "any.required": `"Barangay" is required`
  }),

  address: Joi.string().optional().messages({
    "string.base": `"Address" must be a string`,
    "string.empty": `"Address" cannot be an empty field`,
    "any.required": `"Address" is required`
  }),

  phoneNumber: Joi.string().pattern(/^9\d{9}$/).optional().messages({
    "string.pattern.base": `"Phone Number" must start with 9 and be exactly 10 digits`,
    "string.base": `"Phone Number" must be a string`,
    "string.empty": `"Phone Number" cannot be an empty field`,
    "any.required": `"Phone Number" is required`
  })
})

module.exports.saveAsDraftTab3DTO = Joi.object({
  accountName: Joi.string().optional().messages({
    "string.base": `"Name" must be a string`,
    "string.empty": `"Name" cannot be an empty field`,
    "any.required": `"Name" is required`
  }),

  accountNumber: Joi.string().pattern(/^9\d{9}$/).optional().messages({
    "string.pattern.base": `"Number" must start with 9 and be exactly 10 digits`,
    "string.base": `"Number" must be a string`,
    "string.empty": `"Number" cannot be an empty field`,
    "any.required": `"Number" is required`
  })
})

const accountNameEnum = ["NOT_STARTED", "IN_PROGRESS", "DECLINED", "APPROVED"];
module.exports.sendApplicationDTO = Joi.object({
  status: Joi.string().valid(...accountNameEnum).required().messages({
    "string.base": `"Status" must be a string`,
    "string.empty": `"Status" cannot be an empty field`,
    "any.only": `"Status" must be one of the following values: ${accountNameEnum.join(', ')}`,
  }),
});

module.exports.declineApplicationDTO = Joi.object({
  shopId: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": `"Shop" must be a valid MongoDB ObjectId`,
    "string.base": `"Shop" should be a type of "string"`,
    "string.empty": `"Shop" cannot be an empty field`,
  }),
  status: Joi.string().valid(...accountNameEnum).required().messages({
    "string.base": `"Status" must be a string`,
    "string.empty": `"Status" cannot be an empty field`,
    "any.only": `"Status" must be one of the following values: ${accountNameEnum.join(', ')}`,
  }),
  tab1: Joi.string().optional().messages({
    "string.base": `"Error Message" must be a string`,
  }),
  tab2: Joi.string().optional().messages({
    "string.base": `"Error Message" must be a string`,
  }),
  tab3: Joi.string().optional().messages({
    "string.base": `"Error Message" must be a string`
  }),
});

module.exports.approveApplicationDTO = Joi.object({
  shopId: Joi.string().pattern(objectIdPattern).required().messages({
    "string.pattern.base": `"Shop" must be a valid MongoDB ObjectId`,
    "string.base": `"Shop" should be a type of "string"`,
    "string.empty": `"Shop" cannot be an empty field`,
  }),
  status: Joi.string().valid(...accountNameEnum).required().messages({
    "string.base": `"Status" must be a string`,
    "string.empty": `"Status" cannot be an empty field`,
    "any.only": `"Status" must be one of the following values: ${accountNameEnum.join(', ')}`,
  })
});

module.exports.updateBuyerLocationDTO = Joi.object({
  coordinates: Joi.object({
    lat: Joi.number().required().messages({
      "number.base": `"Latitude" must be a number`,
      "any.required": `"Latitude" is required`,
    }),
    lng: Joi.number().required().messages({
      "number.base": `"Longitude" must be a number`,
      "any.required": `"Longitude" is required`,
    }),
  }).required().messages({
    "object.base": `"Coordinates" must be an object`,
    "any.required": `"Coordinates" field is required`,
  }),
});

module.exports.addPartialShopDTO = Joi.object({
  coordinates: Joi.object({
    lat: Joi.number().required().messages({
      "number.base": `"Latitude" must be a number`,
      "any.required": `"Latitude" is required`,
    }),
    lng: Joi.number().required().messages({
      "number.base": `"Longitude" must be a number`,
      "any.required": `"Longitude" is required`,
    }),
  }).required().messages({
    "object.base": `"Coordinates" must be an object`,
    "any.required": `"Coordinates" field is required`,
  }),
  businessName: Joi.string().optional().messages({
    "string.base": `"Business Name" must be a string`,
    "string.empty": `"Business Name" cannot be an empty field`,
    "any.required": `"Business Name" is required`
  }),
});


const blogStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const blogAudiences = ["PUBLIC", "SELLER", "BUYER"];
module.exports.blogDTO = Joi.object({

  title: Joi.string().optional().messages({
    "string.base": `"Business Name" must be a string`,
    "string.empty": `"Business Name" cannot be an empty field`,
    "any.required": `"Business Name" is required`
  }),
  content: Joi.string().optional().messages({
    "string.base": `"Business Name" must be a string`,
    "string.empty": `"Business Name" cannot be an empty field`,
    "any.required": `"Business Name" is required`
  }),
  status: Joi.string().valid(...blogStatuses).required().messages({
    "string.base": `"Status" must be a string`,
    "string.empty": `"Status" cannot be an empty field`,
    "any.only": `"Status" must be one of the following values: ${blogStatuses.join(', ')}`,
  }),
  audience: Joi.string().valid(...blogAudiences).required().messages({
    "string.base": `"Audience" must be a string`,
    "string.empty": `"Audience" cannot be an empty field`,
    "any.only": `"Audience" must be one of the following values: ${blogAudiences.join(', ')}`,
  }),
});

