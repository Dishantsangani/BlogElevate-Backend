require("dotenv").config();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const User = require("../Model/UserModel");
const Comment = require("../Model/UserComment");

// Sign in (Login)
async function UserSignin(req, res) {
  try {
    const { email, password } = req.body;

    // User Finding By Email
    const UserFind = await User.findOne({ email });
    if (!UserFind) {
      return res.status(404).json({ message: "User Not Registred" });
    }

    // Password Validation
    const ValidPassword = await bcrypt.compare(password, UserFind.password);
    if (!ValidPassword) {
      return res
        .status(401)
        .json({ status: false, message: "Incorrect Password" });
    }

    // JWT Token
    const Token = jwt.sign(
      { id: UserFind._id, email: UserFind.email },
      process.env.KEY,
      { expiresIn: "2h" }
    );

    res.cookie("Token", Token, { httpOnly: true, maxAge: 720000 });
    return res
      .status(200)
      .json({ status: true, message: "Login SuccessFully", Token });
  } catch (err) {
    console.log("Sign In Error  ", err);
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
}

// Sign Up (Registor)
async function UserSignUp(req, res) {
  try {
    const { username, email, password } = req.body;
    // User Find Email
    const UserFind = await User.findOne({ email });
    if (UserFind) {
      return res.status(400).json({ message: "User  Already Existed" });
    }

    // Password Hashing
    const HashPassword = await bcrypt.hash(password, 10);

    // New User Created
    const NewUser = new User({
      username,
      email,
      password: HashPassword,
    });
    await NewUser.save();

    // Token Generating
    const Token = jwt.sign(
      { id: NewUser._id, email: NewUser.email },
      process.env.KEY,
      { expiresIn: "1h" }
    );
    return res.status(201).json({
      status: true,
      message: "User Created Successfully",
      token: Token,
    });
  } catch (err) {
    console.log("SignUp Error", err);
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
}

async function UserForgotPassword(req, res) {
  const { email } = req.body;
  try {
    const UserFind = await User.findOne({ email });
    if (!UserFind) {
      return res
        .status(404)
        .json({ status: false, message: "User Not Registerd" });
    }
    // Token
    const Token = jwt.sign(
      { id: UserFind._id, email: UserFind.email },
      process.env.KEY,
      { expiresIn: "15m" }
    );
    // Email Structure
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    var mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password",
      text: `Click The Link To Reset Your Password:  http://localhost:5173/resetpassword/${Token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Email Error: ", error);
        return res
          .status(500)
          .json({ status: false, message: "Error Sending Email" });
      } else {
        return res.json({ status: true, message: "Reset Link  Sent To Email" });
      }
    });
  } catch (err) {
    console.log("Server Error", err);
    return res
      .status(500)
      .json({ status: false, message: "Internal Server Error" });
  }
}

// Reset Password
async function UserResetPassword(req, res) {
  const token = req.params.token;
  const { password } = req.body;
  try {
    const Decoded = jwt.verify(token, process.env.KEY);
    const id = Decoded.id;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Hash New Password
    const HashPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(id, { password: HashPassword });

    return res.json({ status: true, message: "Update Password" });
  } catch (err) {
    console.error("Password Reset Error:", err);
    return res.status(401).json({
      status: false,
      message: "Invalid or expired token",
    });
  }
}

// Email Sending Contact Page
async function UserEmailSend(req, res) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { name, email, message } = req.body;

  console.log("Received Data:", req.body); // Debugging

  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "receiver@example.com", // Change to a valid email address
    subject: `New Contact Form Submission from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Email sent successfully!", info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Added Comment
async function UserAddComment(req, res) {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required!" });
    }

    const newComment = new Comment({ name, email, message });
    await newComment.save();

    return res
      .status(201)
      .json({ success: true, message: "Comment added!", newComment });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Get All Comment
async function UserGetComments(req, res) {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, comments });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Payment
async function UserPayment(req, res) {
  try {
    const product = await stripe.products.create({ name: "Membership" });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 349 * 100,
      currency: "usd",
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      mode: "payment",
      success_url: "http://localhost:5173/pricing",
      cancel_url: "http://localhost:5173/pricing",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating payment: ", error);
    res.status(500).json({ error: "Payment creation failed" });
  }
}

module.exports = {
  UserSignin,
  UserSignUp,
  UserForgotPassword,
  UserResetPassword,
  UserEmailSend,
  UserAddComment,
  UserGetComments,
  UserPayment,
};
