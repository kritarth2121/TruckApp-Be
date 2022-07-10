import mongoose from "mongoose";
const {Schema} = mongoose;

export enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    EMPLOYEE = "employee",
    DRIVER = "driver",
    USER = "user",
}

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        followers: [{type: Schema.Types.ObjectId, ref: "User"}],
        following: [{type: Schema.Types.ObjectId, ref: "User"}],
        bio: {
            type: String,
        },
        profileUrl: {
            type: String,
        },
        role: {
            type: String,
            enum:UserRole,
            
            required: true,
        },
        mobile_number: {
            type: String,
            required: true,
        },

        chats: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    },
    {timestamps: true}
);

export const User = mongoose.model("users", userSchema);
