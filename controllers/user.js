

const padayon = require("../services/padayon"),
  path = require("path"),
  base = path.basename(__filename, ".js"),
  model = require(`./../models/${base}`),
  shopModel = require(`./../models/shop`)
bookController = require(`./../controllers/book`),
  bcrypt = require("bcrypt"),
  jwt = require("jsonwebtoken"),
  qrcode = require("./../services/qrcode"),
  barcode = require("./../services/barcode"),
  pdf = require("./../services/pdf"),
  excel = require("./../services/excel"),
  papaparse = require("./../services/papaparse"),
  stream = require("stream"),
  _ = require("lodash"),
  { userAccessDTO, userDTO, addUserDTO, addPartialShopDTO, updateBuyerLocationDTO } = require("../services/dto"),
  email = require("./../services/email"),
  id_card = require("./../services/id_card"),
  Product = require('./product'),
  moment = require("moment-timezone"),
  { differenceInMinutes, differenceInSeconds } = require("date-fns"),
  cloudinary = require("./../services/cloudinary");

module.exports.getUser = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    req.fnParams = {
      userId: req.params?.id,
    };

    await model.getUser(req, res, (result) => {
      response.data = result ?? {};
    });
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::getUser", error, req, res);
  }
};

module.exports.getAuthUser = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    req.fnParams = {
      userId: req.auth?._id,
    };

    await model.getUser(req, res, (result) => {
      response.data = result ?? {};
    });
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::getUser", error, req, res);
  }
};

module.exports.getUsers = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    await model.getUsers(req, res, (result) => {
      response.data = result;
    });
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::getUsers", error, req, res);
  }
};

module.exports.getBuyers = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    const buyers = await model.getBuyers(req, res);
    console.log('------buyers', buyers)
    response.data = buyers;


    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::getBuyers", error, req, res);
  }
};

module.exports.authenticate = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    await model.authenticate(req, res, (result) => {
      //checks if credentials exists
      if (_.size(result)) {
        //checks if user account is blocked
        if (result[0].isblock) {
          response.success = false;
          throw new padayon.ForbiddenException("Your account has been block");
        } else {
          //if not blocked then generate token
          const token = jwt.sign(result[0], process.env.JWT_PRIVATE_KEY, {
            expiresIn: "1d",
          });

          // set token as cookie
          // res.cookie("jwt_token", token, {
          //   httpOnly: true,
          //   maxAge: 86400000,
          // });

          response.data = { token, account: result[0] };
        }
      } else {
        //credentials does'nt exists
        response.success = false;
        response.code = 401;
        throw new padayon.UnauthorizedException("Invalid Credentials");
      }
    });
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::authenticate", error, req, res);
  }
}; //---------done

module.exports.getUsers = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    await model.getUsers(req, res, (result) => {
      response.data = result;
    });
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::getUsers", error, req, res);
  }
};

module.exports.authenticate = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    await model.authenticate(req, res, (result) => {
      //checks if credentials exists
      if (_.size(result)) {
        //checks if user account is blocked
        if (result[0].isblock) {
          response.success = false;
          throw new padayon.ForbiddenException("Your account has been block");
        } else {
          //if not blocked then generate token
          const token = jwt.sign(result[0], process.env.JWT_PRIVATE_KEY, {
            expiresIn: "1d",
          });

          // set token as cookie
          // res.cookie("jwt_token", token, {
          //   httpOnly: true,
          //   maxAge: 86400000,
          // });

          response.data = { token, account: result[0] };
        }
      } else {
        //credentials does'nt exists
        response.success = false;
        response.code = 401;
        throw new padayon.UnauthorizedException("Invalid Credentials");
      }
    });
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::authenticate", error, req, res);
  }
}; //---------done

module.exports.googleRedirect = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::googleRedirect", error, req, res);
  }
}; //---------done

module.exports.updateUserAccess = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    const body = {
      isallowedtodelete: req?.body?.isallowedtodelete,
      isallowedtocreate: req?.body?.isallowedtocreate,
      isallowedtoupdate: req?.body?.isallowedtoupdate,
      isblock: req?.body?.isblock,
    };

    await userAccessDTO.validateAsync(body);

    req.fnParams = {
      userId: req.params?.id,
      isallowedtodelete: body.isallowedtodelete,
      isallowedtocreate: body.isallowedtocreate,
      isallowedtoupdate: body.isallowedtoupdate,
      isblock: body.isblock,
    };

    await model.updateUserAccess(req, res, (result) => {
      if (_.isEmpty(result) || !_.isEqual(result.n, 1))
        throw new padayon.BadRequestException("User not found.");

      response.data = result ?? {};
    });
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::updateUserAccess", error, req, res);
  }
}; //---------done

module.exports.verifyAccessControl = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    await model.verifyAccessControl(req, res, (result) => {
      response.success = !_.isEmpty(result) ? true : false;
      response.data = result;
    });

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::User::verifyAccessControl",
      error,
      req,
      res
    );
  }
}; //---------done

module.exports.saveFile = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    const upload = await cloudinary.uploader.upload(req.file.path, {
      folder: "profile_pictures",
      type: "authenticated",
      resource_type: "auto",
      // allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'xls', 'xlsx']
    });

    response.data = upload;
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::saveFile", error, req, res);
  }
};

module.exports.saveMultipleFiles = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    const uploads = [];
    for (const file of req.files) {
      const { path } = file;

      const upload = await cloudinary.uploader.upload(path, {
        folder: "profile_pictures",
        type: "authenticated",
        resource_type: "auto",
        // allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'xls', 'xlsx']
      });

      uploads.push(upload);
    }

    response.data = uploads;
    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::User::saveMultipleFiles",
      error,
      req,
      res
    );
  }
};

module.exports.generateQR = async (req, res) => {
  try {
    const response = { success: true, code: 200 };
    let user;

    req.fnParams = {
      userId: req.auth?._id,
    };

    await model.getUser(req, res, (result) => {
      if (_.isEmpty(result))
        throw new padayon.BadRequestException("No user found!");

      user = result;
    });

    const generatedQR = await qrcode.generate(user);

    if (
      _.isEmpty(generatedQR?.secure_url) ||
      _.isEmpty(generatedQR?.public_id) ||
      _.isEmpty(generatedQR?.format)
    )
      throw new padayon.BadRequestException("Invalid QR Code generation.");

    req.fnParams = {
      secure_url: generatedQR.secure_url,
      public_id: generatedQR.public_id,
      format: generatedQR.format,
      _id: req.auth?._id,
    };

    await model.generateQR(req, res, (result) => {
      if (_.isEmpty(result) || !_.isEqual(result.nModified, 1))
        throw new padayon.BadRequestException(
          "The updated QR Code is not reflected in user's acccount. Please try again."
        );

      response.data = {
        url: generatedQR.secure_url,
        bytes: generatedQR.bytes,
        format: generatedQR.format,
      };
    });

    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::generateQR", error, req, res);
  }
}; //---------done

module.exports.generateIdCard = async (req, res) => {
  try {
    const response = { success: true, code: 200 };
    let user;

    req.fnParams = {
      userId: req.auth?._id,
    };

    await model.getUser(req, res, (result) => {
      if (_.isEmpty(result))
        throw new padayon.BadRequestException("No user found!");
      user = result;
    });

    const generatedIdCard = await id_card.generate(user);

    if (
      _.isEmpty(generatedIdCard.front_card?.secure_url) ||
      _.isEmpty(generatedIdCard.front_card?.public_id) ||
      _.isEmpty(generatedIdCard.front_card?.format) ||
      _.isEmpty(generatedIdCard.back_card?.secure_url) ||
      _.isEmpty(generatedIdCard.back_card?.public_id) ||
      _.isEmpty(generatedIdCard.back_card?.format)
    )
      throw new padayon.BadRequestException("Invalid ID Card generation.");

    req.fnParams = {
      front_card: {
        secure_url: generatedIdCard.front_card?.secure_url,
        public_id: generatedIdCard.front_card?.public_id,
        format: generatedIdCard.front_card?.format,
      },
      back_card: {
        secure_url: generatedIdCard.back_card?.secure_url,
        public_id: generatedIdCard.back_card?.public_id,
        format: generatedIdCard.back_card?.format,
      },
      _id: req.auth?._id,
    };

    await model.generateIdCard(req, res, (result) => {
      if (_.isEmpty(result) || !_.isEqual(result.nModified, 1)) {
        throw new padayon.BadRequestException(
          "The updated ID Card is not reflected in user's acccount. Please try again."
        );
      }

      response.data = {
        front_card: {
          secure_url: generatedIdCard.front_card?.secure_url,
          public_id: generatedIdCard.front_card?.public_id,
          format: generatedIdCard.front_card?.format,
        },
        back_card: {
          secure_url: generatedIdCard.back_card?.secure_url,
          public_id: generatedIdCard.back_card?.public_id,
          format: generatedIdCard.back_card?.format,
        },
      };
    });
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::generateIdCard", error, req, res);
  }
}; //---------done

module.exports.generateBarcode = async (req, res) => {
  try {
    const response = { success: true, code: 200 };
    const generatedBarcode = await barcode.generate(req.auth._id);

    if (
      _.isEmpty(generatedBarcode?.secure_url) ||
      _.isEmpty(generatedBarcode?.public_id) ||
      _.isEmpty(generatedBarcode?.format) ||
      _.isEmpty(generatedBarcode?.text_output)
    )
      throw new padayon.BadRequestException("Invalid Barcode generation.");

    req.fnParams = {
      secure_url: generatedBarcode.secure_url,
      public_id: generatedBarcode.public_id,
      format: generatedBarcode.format,
      text_output: generatedBarcode.text_output,
      _id: req.auth?._id,
    };

    await model.generateBarcode(req, res, (result) => {
      if (_.isEmpty(result) || !_.isEqual(result.nModified, 1))
        throw new padayon.BadRequestException(
          "The updated Barcode is not reflected in user's acccount. Please try again."
        );

      response.data = {
        url: generatedBarcode.secure_url,
        bytes: generatedBarcode.bytes,
        format: generatedBarcode.format,
        text_output: generatedBarcode.text_output,
      };
    });
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::generateBarcode", error, req, res);
  }
}; //---------done

module.exports.downloadPDF = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    const books = await bookController.getBooks(req, res);

    const filename = padayon.uniqueId({ fileExt: "pdf" });
    res.writeHead(200, {
      "Content-Type": "application/pdf", // Set the appropriate content type
      "Content-Disposition": `attachment; filename=${filename}`, // Change the filename as needed
    });
    const user = await this.getAuthUser(req, res);
    const pdfReadStream = await pdf.generate("unknown_report", {
      name: user.data?.firstname + " " + user.data?.lastname,
      th: ["AUTHOR", "STOCKS", "TITLE", "PRICE"],
      td: books?.data?.items,
      qrcode: user.data?.qrcode?.url,
    });

    pdfReadStream.on("data", (chunk) => {
      res.write(chunk);
    });

    pdfReadStream.on("error", (err) => {
      throw new Error("Failed during PDF file download");
    });

    pdfReadStream.on("close", () => {
      res.end();
    });
  } catch (error) {
    padayon.ErrorHandler("Controller::User::downloadPDF", error, req, res);
  }
}; //---------done
async function fetchFile(public_id, options) {
  const file = await cloudinary.image(public_id, options);
  const start = file.indexOf("'") + 1;
  const end = file.lastIndexOf("'");
  const url = file.slice(start, end);

  return url;
}

module.exports.downloadExcel = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    const users = await this.getUsers(req, res);

    if (_.size(users.data) === 0)
      throw new padayon.BadRequestException("There were no users found.");

    const buffer = await excel.generate({
      sheetName: "Sheet#1",
      header: {
        start: "A1",
        title: "Users List",
      },
      table: {
        start: "A4",
        fields: ["Email", "First Name", "Last Name", "Role"],
        data: users.data,
        dataKeys: ["email", "firstname", "lastname", "role"],
      },
    });

    const filename = padayon.uniqueId({ fileExt: "xlsx" });

    res.writeHead(200, {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${filename}`,
    });
    const readStream = new stream.PassThrough();
    readStream.end(buffer);
    readStream.pipe(res);
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::downloadExcel", error, req, res);
  }
};

module.exports.addUser = async (req, res) => {
  try {
    let response = { success: true, code: 201 };
    let shop = {}
    let user = {}

    if (req.body.role === 'seller') {

      const body = {
        coordinates: req.body.coordinates,
        businessName: req.body.businessname,
      };
      req.fnParams = {
        ...body
      };
      console.log('===body', body)

      await addPartialShopDTO.validateAsync(body);
      shop = await shopModel.addShop(req, res);

    }

    console.log('------1', shop)
    const hashedPassword = await bcrypt.hash(req.body.passwordGroup.password, 11);
    console.log('------2')
    const userBody = {
      email: req.body.email,
      password: hashedPassword,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      role: req.body.role,
      shop: shop._id
    };
    console.log('------3')
    console.log('=====userBody', userBody)
    await addUserDTO.validateAsync(userBody);

    req.fnParams = userBody;
    req.shop = shop
    user = await model.addUser(req, res);


    response.data = { shop, user }

    console.log('==========response.data', response.data)
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::addUser", error, req, res);
  }
};



module.exports.getCart = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const result = await model.getCart(req, res);
    response.data = result;

    return response;
  } catch (error) {
    padayon.ErrorHandler(
      "Controller::User::getCart",
      error,
      req,
      res
    );
  }
};

module.exports.addToCart = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    req.params.id = req.body.lineItem.productId;
    const productController = await Product.getProduct(req, res);

    if (!productController.data) {
      throw new padayon.BadRequestException(`Product not found`);
    } else {
      if (productController.data.qty < req.body.lineItem.orderQty || req.body.lineItem.orderQty <= 0) {
        throw new padayon.BadRequestException(`Invalid order quantity. Ensure quantity is between 1 and ${productController.data.qty}.`, { currentProductStock: productController.data.qty, _id: productController.data._id });
      }
    }

    const result = await model.addToCart(req, res);
    response.data = result;

    return response;
  } catch (error) {
    console.error("Error Data:", error.data);
    padayon.ErrorHandler(
      "Controller::User::addToCart",
      error,
      req,
      res
    );
  }
};

module.exports.generateOTP = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    const otp = padayon.generate4DigitCodeWithZeros();
    const now = new Date(); // current UTC
    const expiresAt = new Date(now.getTime() + 1 * 60000); // add 1 minute

    req.fnParams = {
      otp,
      ...req.query,
      expiresAt
    }

    const otpDetails = await model.getUserOTPDetails(req, res);

    const currentOTP = {
      isConsumed: otpDetails.user.otp.isConsumed,
      expiresAt: differenceInSeconds(otpDetails.user.otp.expiresAt, now)
    }

    if (currentOTP.expiresAt > 0 && !currentOTP.isConsumed) {
      throw new padayon.BadRequestException(
        "A valid OTP already exists. Please use the existing OTP or wait for it to expire before requesting a new one.",
        { errorType: 'OTP_NOT_EXPIRED', expiresAt: currentOTP.expiresAt }
      );
    }

    const result = await model.generateOTP(req, res);
    const localTime = moment.utc(result.expiresAt).tz(req.timezone);
    console.log('=========otpDetails', otpDetails.user)
    // emailer
    //otpDetails.user.email
    email.notify('dulacamen27@gmail.com', "otp_template", {
      header: `Your One-Time Password`,
      banner: "spoonwise-logo-full",
      name: otpDetails.user.role === 'seller' ? otpDetails.shop.shop.businessName : otpDetails.user.firstname,
      otp: otp,
    })

    const seconds = differenceInSeconds(expiresAt, now);

    response.data = { expiresAt: seconds };
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::generateOTP", error, req, res);
  }
};

module.exports.checkOTP = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    const now = new Date(); // current UTC
    req.fnParams = {
      ...req.query
    }

    const otpDetails = await model.getUserOTPDetails(req, res);
    const currentOTP = {
      isConsumed: otpDetails.user.otp.isConsumed,
      code: otpDetails.user.otp.code,
      expiresAt: differenceInSeconds(otpDetails.user.otp.expiresAt, now)
    }

    // if (currentOTP.expiresAt <= 0) {
    //   throw new padayon.BadRequestException(
    //     "OTP has expired.",
    //     { errorType: 'OTP_EXPIRED' }
    //   );
    // } else if (currentOTP.isConsumed) {
    //   throw new padayon.BadRequestException(
    //     "OTP already used.",
    //     { errorType: 'OTP_CONSUMED' }
    //   );
    // } else if (currentOTP.code !== req.fnParams.otp) {
    //   throw new padayon.BadRequestException(
    //     "Incorrect OTP.",
    //     { errorType: 'OTP_INCORRECT' }
    //   );
    // } else if (currentOTP.code === req.fnParams.otp) {
    await model.consumedOTP(req, res);
    response.data = { message: 'OTP_SUCCESS' };
    // }

    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::checkOTP", error, req, res);
  }
};



module.exports.removeCheckedCartLineItems = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    console.log(1)
    const result = await model.removeCheckedCartLineItems(req, res);
    console.log(2)
    response.data = result;
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::removeCheckedCartLineItems", error, req, res);
  }
};

module.exports.getUserAuth = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    req.fnParams = {
      userId: req.auth?._id,
    };
    console.log(' req.fnParams', req.fnParams)
    const [data] = await model.getUserAuth(req, res);
    response.data = data;
    console.log('---response.data', response)
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::getUserAuth", error, req, res);
  }
};

module.exports.updateBuyerLocation = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    const body = {
      coordinates: req?.body?.coordinates,
    };

    await updateBuyerLocationDTO.validateAsync(body);

    req.fnParams = {
      userId: req.auth._id,
      coordinates: body.coordinates
    };

    const data = await model.updateBuyerLocation(req, res);
    response.data = data;
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::updateBuyerLocation", error, req, res);
  }
}; //---------done
