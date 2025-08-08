"use_strict";

const { execute } = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    express = require("express"),
    router = express.Router(),
    multer = require('./../services/multer'),
    controller = require(`../controllers/${base}`);

router.post(
    `/api/${base}/createBlog`,
    execute(controller.createBlog, {
        secured: true,
        role: ["admin"],
    })
); //---------done

router.put(
    `/api/${base}/updateBlog/:blogId`,
    execute(controller.updateBlog, {
        secured: true,
        role: ["admin"],
    })
); //---------done

router.get(
    `/api/${base}/getBlogs`,
    execute(controller.getBlogs, {
        secured: true,
        role: ["admin", "seller", "buyer"],
    })
); //---------done

router.get(
    `/api/${base}/getPastBlogs`,
    execute(controller.getPastBlogs, {
        secured: true,
        role: ["admin", "seller", "buyer"],
    })
); //---------done

router.get(
    `/api/${base}/getBlog/:blogId`,
    execute(controller.getBlog, {
        secured: true,
        role: ["admin", "seller", "buyer"],
    })
); //---------done



module.exports = router;
