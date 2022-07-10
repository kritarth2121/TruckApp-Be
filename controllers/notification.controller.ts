import {Notification} from "../models/notification.model";
import {User} from "../models/user.model";

export const newNotification = async (targetId: any, sourceId: any, type: any, postId: number) => {
    try {
        let notification;
        if (postId === 0) {
            notification = new Notification({
                targetId: targetId,
                sourceId: sourceId,
                isRead: false,
                type: type,
            });
        } else {
            notification = new Notification({
                targetId: targetId,
                sourceId: sourceId,
                isRead: false,
                type: type,
                postId: postId,
            });
        }
        await notification.save();
    } catch (error: any) {
        console.log(error);
    }
};

export const fetchUserNotifications = async (req: {params: {userId: any}}, res: any) => {
    try {
        const userId = req.params.userId;
        const user = User.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "invalid id, user not found",
            });
        }
        let result = [];
        const notifications = await Notification.find({targetId: userId}).sort({
            createdAt: -1,
        });
        for (const notification of notifications) {
            const _user = await User.findById(notification.sourceId);
            result.push({
                ...notification._doc,
                sourceName: _user.name,
            });
        }
        return res.json({success: true, notifications: result});
    } catch (error: any) {
        return res.status(500).json({success: false, message: (error as any).message});
    }
};
