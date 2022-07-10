import jwt from "jsonwebtoken";
import {User} from "../models/user.model";
require("dotenv");

export const authenticate = async (req: any, res: any, next: any) => {
    try {
        let token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized request, Token not found.",
            });
        }
        token = token.split(" ")[1];
        const decodedValue = jwt.verify(token, process.env.JWT_SECRET) as any;
        const id = decodedValue._id ? decodedValue._id : decodedValue.id;
        const user = await User.findById(id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized request, Either user not found or invalid token",
            });
        }
        req.user = user;
        next();
    } catch (err) {
        console.log(err);
        res.status(401).json({success: false, errMessage: err});
    }
};
