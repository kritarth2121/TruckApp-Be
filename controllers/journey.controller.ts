import {Journey} from "../models/journey.model";
import {User} from "../models/user.model";

export const createJourney = async (req: {body: any}, res: any) => {
    const {driver_id, start_location, end_location, user_id, date} = req.body;
    try {
        const driver = await User.findById(driver_id);
        const user = await User.findById(user_id);
        if (!user || !driver) {
            return res.json({success: false, massage: "User not found"});
        }
        let newJourney = new Journey({driver: driver_id, start_location, end_location, user: user_id, date});
        await newJourney.save();
        return res.status(200).json({
            success: true,
            journey: newJourney,
        });
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const listJourney = async (req: any, res: any) => {
    const {status} = req.query;
    try {
        if (status) {
            const journeys = await Journey.find({status});
            return res.json({success: false, journeys});
        }
        const journeys = await Journey.find();
        return res.json({success: false, journeys});
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const listJourneyDriver = async (req: any, res: any) => {
    const {status} = req.query;
    try {
        if (status) {
            const journeys = await Journey.find({status, driver: req.user._id});
            return res.json({success: false, journeys});
        }
        const journeys = await Journey.find({driver: req.user._id});
        return res.json({success: false, journeys});
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const updateJourneyStatus = async (req: any, res: any) => {
    const {status} = req.query;
    const {journeyId} = req.params;
    try {
        const journey = await Journey.findById(journeyId);
        journey.status = status;
        await journey.save();
        return res.status(200).json({
            success: true,
            journey,
        });
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};
