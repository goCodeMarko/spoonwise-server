

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
  sendgrid = require("./../services/sendgrid_emailer"),
  id_card = require("./../services/id_card"),
  Product = require('./product'),
  blogModel = require('./../models/blog'),
  blogController = require('./blog'),
  moment = require("moment-timezone"),
  uap = require('ua-parser-js'),
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

    const account = await model.authenticate(req, res);
    console.log('---account', account)
    if (!_.size(account)) throw new padayon.UnauthorizedException("Invalid Credentials");

    //checks if user account is blocked
    if (account[0].isblock) {
      response.success = false;
      throw new padayon.ForbiddenException("Your account has been block");
    } else {
      //if not blocked generate OTP
      req.query = { userId: account[0]._id }
      const generate_otp_res = await this.generateOTP(req, res);

      return { success: generate_otp_res.success, account: account[0], status: generate_otp_res.status, expiresAt: generate_otp_res.expiresAt };
    }


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
    const otp = padayon.generate4DigitCodeWithZeros();
    const now = new Date(); // current UTC
    const expiresAt = new Date(now.getTime() + 1 * 60000); // add 1 minute

    req.fnParams = {
      otp,
      ...req.query,
      expiresAt
    }

    const userDetails = await model.getUserDetails(req, res);

    const currentOTP = {
      isConsumed: userDetails.user.otp.isConsumed,
      expiresAt: differenceInSeconds(userDetails.user.otp.expiresAt, now)
    }
    console.log('------currentOTP', currentOTP)
    const seconds = differenceInSeconds(expiresAt, now);
    if (currentOTP.expiresAt > 0 && !currentOTP.isConsumed) {
      return { success: false, expiresAt: currentOTP.expiresAt, status: 'OTP_NOT_EXPIRED', status_msg: 'A valid OTP already exists. Please use the existing OTP or wait for it to expire before requesting a new one."' };

    } else {
      const result = await model.generateOTP(req, res);
      const localTime = moment.utc(result.expiresAt).tz(req.timezone);

      /*
      email.notify(userDetails.user.email, "otp_template", {
        header: `Your One-Time Password`,
        banner: "spoonwise-logo-full",
        name: userDetails.user.role === 'seller' ? userDetails.shop.shop.businessName : userDetails.user.firstname,
        otp: otp,
      })
      */

      const name = userDetails.user?.role === 'seller' ? userDetails.shop?.shop?.businessName : userDetails.user?.firstname;
      console.log('---------------email', userDetails.user?.email)
      sendgrid.notify(userDetails.user?.email, {
        name,
        code: otp,
      })

      return { success: true, expiresAt: seconds, status: 'OTP_SUCCESS' };
    }
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

    const userDetails = await model.getUserDetails(req, res);
    console.log('---------userDetail', userDetails)
    const currentOTP = {
      isConsumed: userDetails.user.otp.isConsumed,
      code: userDetails.user.otp.code,
      expiresAt: differenceInSeconds(userDetails.user.otp.expiresAt, now)
    }

    const account = {
      _id: userDetails.user._id,
      email: userDetails.user.email,
      role: userDetails.user.role,
      shop: userDetails.shop.shop,
      fullname: userDetails.user.fullname,
      password: userDetails.user.password,
      profile_picture: userDetails.user.profile_picture,
      phoneNumber: userDetails.user.phoneNumber,
      address: userDetails.user.address,
      isblock: userDetails.user.isblock,
      company: userDetails.user.company,
      branch: userDetails.user.branch,
      coordinates: userDetails.user.coordinates,
      cart: userDetails.user.cart,
      spoonwiseAI: userDetails.user.spoonwiseAI
    }

    if (currentOTP.expiresAt <= 0) {
      throw new padayon.BadRequestException(
        "OTP has expired.",
        { status: 'OTP_EXPIRED' }
      );
    } else if (currentOTP.isConsumed) {
      throw new padayon.BadRequestException(
        "OTP already used.",
        { status: 'OTP_CONSUMED' }
      );
    } else if (currentOTP.code !== req.fnParams.otp) {
      throw new padayon.BadRequestException(
        "Incorrect OTP.",
        { status: 'OTP_INCORRECT' }
      );
    } else if (currentOTP.code === req.fnParams.otp) {
      await model.consumedOTP(req, res);


      const accessToken = jwt.sign(account, process.env.ACCESSTOKEN_PRIVATE_KEY, {
        expiresIn: "12h",
      });

      const refreshToken = jwt.sign(account, process.env.REFRESHTOKEN_PRIVATE_KEY, {
        expiresIn: "7d",
      });

      const ua = uap(req.headers['user-agent']);
      req.fnParams = {
        token: refreshToken,
        userId: account._id,
        expiresAt: moment().add(7, 'days').toDate(),
        deviceInfo: {
          device: ua.device,
          os: ua.os,
        }
      }

      await model.addRefreshToken(req, res);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,        // important in production must true (HTTPS only)
        sameSite: "strict",
        domain: ".spoonwise.space",
        path: "/",
        maxAge: 15 * 60 * 1000 // 15 minutes = 900,000 ms
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        domain: ".spoonwise.space",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days = 604,800,000 ms
      });

      console.log('accessToken', accessToken)

      response.data = { status: 'OTP_CORRECT', account };
    }

    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::checkOTP", error, req, res);
  }
};

module.exports.rotateAccessToken = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    const old_refresh_token = req.cookies.refreshToken;
    const { iat, exp, ...oldData } = jwt.verify(old_refresh_token, process.env.REFRESHTOKEN_PRIVATE_KEY);

    const accessToken = jwt.sign(oldData, process.env.ACCESSTOKEN_PRIVATE_KEY, {
      expiresIn: "12h",
    });

    const refreshToken = jwt.sign(oldData, process.env.REFRESHTOKEN_PRIVATE_KEY, {
      expiresIn: "7d",
    });

    const ua = uap(req.headers['user-agent']);

    req.fnParams = {
      old_refreshtoken: old_refresh_token,
      token: refreshToken,
      userId: oldData._id,
      expiresAt: moment().add(7, 'days').toDate(),
      deviceInfo: {
        device: ua.device,
        os: ua.os,
      }
    }
    console.log('xxxxxxxxxxxxx-5')
    await model.removeOldRefreshToken(req, res);
    await model.addRefreshToken(req, res);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,        // important in production must true (HTTPS only)
      sameSite: "strict",
      domain: ".spoonwise.space",
      path: "/",
      maxAge: 15 * 60 * 1000 // 15 minutes = 900,000 ms
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      domain: ".spoonwise.space",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days = 604,800,000 ms
    });

    response.data = { status: 'ACCESS_TOKEN_ROTATION_SUCCESS' };
    // }

    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::rotateAccessToken", error, req, res);
  }
};

module.exports.removeOldRefreshToken = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    req.fnParams = {
      userId: req.auth?._id,
      old_refreshtoken: req.cookies.refreshToken
    }

    await model.removeOldRefreshToken(req, res);

    response.data = { status: 'REFRESH_TOKEN_REMOVAL_SUCCESS' };

    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::removeOldRefreshToken", error, req, res);
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

module.exports.saveBlog = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    console.log('-------req.params', req.params)


    const blog = await blogController.getBlog(req, res);

    console.log('-------blog', blog)

    if (!blog.data) {
      throw new padayon.BadRequestException("Blog not found");
    }

    req.fnParams = {
      blogId: req.params.blogId
    }

    const data = await model.saveBlog(req, res);

    response.data = data;
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::saveBlog", error, req, res);
  }
};


module.exports.unsaveBlog = async (req, res) => {
  try {
    let response = { success: true, code: 200 };

    console.log('-------req.params', req.params)


    const blog = await blogController.getBlog(req, res);

    console.log('-------blog', blog)

    if (!blog.data) {
      throw new padayon.BadRequestException("Blog not found");
    }

    req.fnParams = {
      blogId: req.params.id
    }

    const data = await model.unsaveBlog(req, res);

    response.data = data;
    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::unsaveBlog", error, req, res);
  }
};


module.exports.getSavedBlogs = async (req, res) => {
  try {
    let response = { success: true, code: 200 };
    req.fnParams = {
      userId: req.auth?._id,
    };

    const data = await model.getSavedBlogs(req, res);
    console.log('---data', data)
    response.data = data?.savedBlogs || [];

    return response;
  } catch (error) {
    padayon.ErrorHandler("Controller::User::getSavedBlogs", error, req, res);
  }
};
