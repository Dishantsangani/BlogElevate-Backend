require("dotenv").config();
const mongoose = require("mongoose");

async function Connection() {
  mongoose
    .connect(process.env.MONGODB)
    .then(() => console.log("Database Connected"))
    .catch((err) => console.log("Database Connection Erorr", err));
}
module.exports = Connection;
