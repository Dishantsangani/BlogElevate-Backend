const express = require("express");
const cors = require("cors");
const router = require("./Routes/UserRoutes");
const Connection = require("./Database/Connection");

const App = express();
const PORT = 2700;

// Database Connection
Connection();

// Middleware
App.use(
  cors({
    origin: ["http://localhost:5173", "https://basdded.netlify.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific methods
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

App.use(express.json());
App.use(express.urlencoded({ extended: true }));

// Handle Preflight Requests
App.options("*", cors());

// Default Route
App.use("/auth", router);

App.get("/", (req, res) => {
  return res.send("Hello From Server");
});

// Server Started
App.listen(PORT, () => console.log(`Server Started at Port ${PORT}`));
