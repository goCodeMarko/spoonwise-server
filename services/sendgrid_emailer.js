const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const _ = require("lodash");
const padayon = require("./padayon");
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


module.exports.notify = async (recipient, data = {}) => {

  const msg = {
    to: recipient,
    from: {
      email: "hello@spoonwise.space",
      name: "Spoonwise"
    },
    templateId: "d-2e091978ee6949dbaa491ca6ab7c41f8",
    dynamicTemplateData: {
      name: _.get(data, "name", "-"),
      code: _.get(data, "code", "-")
    }
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent');
  } catch (error) {
    console.error(error.response?.body);
  }
}