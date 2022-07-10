import mongoose, { ConnectOptions } from "mongoose";
require("dotenv").config();

export function initializeDBConnection() {
    mongoose
        .connect(process.env.DB_URL!, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
        } as ConnectOptions)
        .then(() => console.log("successfully connected"))
        .catch((error: any) => console.error("mongoose connection failed...", error));
}

