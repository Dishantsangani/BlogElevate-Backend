const express = require("express");
const {
  UserSignin,
  UserSignUp,
  UserForgotPassword,
  UserResetPassword,
  UserEmailSend,
  UserAddComment,
  UserGetComments,
  UserPayment,
} = require("../Controller/UserController");

const router = express.Router();

// Post Request
router.post("/signin", UserSignin);
router.post("/signup", UserSignUp);
router.post("/forgotpassword", UserForgotPassword);
router.post("/resetpassword/:token", UserResetPassword);
router.post("/sendemail", UserEmailSend);
router.post("/comment", UserAddComment);
router.post("/payment", UserPayment);

// Get Request
router.get("/comment", UserGetComments);
module.exports = router;
