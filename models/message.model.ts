import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        iv: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        key: {
            type: String,
            required: true,
        },
    },
    {timestamps: true}
);

export const Message = mongoose.model("messages", messageSchema);

