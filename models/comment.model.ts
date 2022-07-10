import mongoose from "mongoose";
const { Schema } = mongoose;

const commentSchema = new mongoose.Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    commentBy: { type: Schema.Types.ObjectId, ref: "User" },
    comment: { type: String },
  },
  { timestamps: true }
);

export const Comment = mongoose.model("comments", commentSchema);
