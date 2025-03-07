import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  displayName: { type: String },
  profileImage: { type: String },
  profileUrl: { type: String },
});

export default mongoose.model("User", userSchema);