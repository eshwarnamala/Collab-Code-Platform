// backend/server.js
import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import "./controllers/authController.js";
import roomRoutes from "./routes/roomRoutes.js";
import { initSocket } from "./utils/socket.js";
import aiRoutes from "./routes/aiRoutes.js";
import MongoStore from "connect-mongo";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(
  cors({
    // origin: "http://localhost:3000",
    // origin: "https://collab-code-platform-client.vercel.app",
    origin: "https://collab-code-platform-client.onrender.com",
    credentials: true,
  })
); 
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, 
      // sameSite: "lax", 
      sameSite: "none", 
      // secure: false, 
      secure: true, 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, 
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("Collab Coding Platform Backend");
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

initSocket(server);

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
