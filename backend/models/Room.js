import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const roomSchema = new mongoose.Schema({
  roomId: { type: String, default: uuidv4, unique: true }, 
  name: { type: String, required: true },
  password: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  files: [
    {
    //   _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      name: { type: String, required: true },
      content: { type: String, default: "" },
      language: { type: String }, 
      isFolder: { type: Boolean, default: false },
      path: { type: String, default: "/" }, 
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("Room", roomSchema);
