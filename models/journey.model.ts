import mongoose from "mongoose";
const {Schema} = mongoose;

export enum JourneyStatus {
    NEW = "new",
    PENDING = "pending",
    COMPLETED = "completed",
}

const journeySchema = new mongoose.Schema(
    {
        driver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        start_location: {
            type: String,
            required: true,
        },
        end_location: {
            type: String,
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: JourneyStatus,
            default: JourneyStatus.NEW,
        },
        date: {
            type: Date,
            required: true,
        },
    },
    {timestamps: true}
);

export const Journey = mongoose.model("journeys", journeySchema);
