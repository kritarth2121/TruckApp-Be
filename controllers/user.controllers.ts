require("dotenv").config();
import {User} from "../models/user.model";
import {Post} from "../models/post.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {extend} from "lodash";
import {newNotification} from "./notification.controller";

export const login = async (req: any, res: any) => {
    const {email, password} = req.body;
    const user = await User.findOne({email: email}).catch((err: any) => {
        console.log(err);
    });
    if (user) {
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (isPasswordCorrect) {
            const token = jwt.sign({id: user._id, name: user.name}, process.env.JWT_SECRET);
            return res.json({
                success: true,
                message: "Login Successful",
                user: user,
                token: token,
            });
        }
        return res.json({
            token: null,
            user: null,
            success: false,
            message: "Wrong password, please try again",
        });
    }
    return res.json({
        token: null,
        user: null,
        success: false,
        message: "No account found with entered email",
    });
};

export const signup = async (req: any, res: any) => {
    const {name, username, email, password} = req.body;
    let user = await User.findOne({email: email}).catch((err: any) => {
        console.log(err);
    });
    if (user) {
        return res.json({
            token: null,
            user: null,
            success: false,
            message: "Account with email already exists, Try logging in instead!",
        });
    }
    user = await User.findOne({username: username}).catch((err: any) => {
        console.log(err);
    });
    if (user) {
        return res.json({
            token: null,
            user: null,
            success: false,
            message: "Account with username already exists",
        });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name: name,
            username: username,
            email: email,
            password: hashedPassword,
            bio: "Hi there! I'm using Kritarth Twitter",
            profileUrl:
                "https://res.cloudinary.com/formula-web-apps/image/upload/v1623766149/148-1486972_mystery-man-avatar-circle-clipart_kldmy3.jpg",
        });

        const savedUser = await newUser.save();
        const token = jwt.sign({id: savedUser._id, name: savedUser.name}, process.env.JWT_SECRET);

        return res.json({
            user: savedUser,
            token: token,
            success: true,
            message: "Signed up successfully",
        });
    } catch (err: any) {
        console.log(err);
        return res.json({
            success: false,
            user: null,
            token: null,
            message: err.message,
        });
    }
};

export const searchById = async (req: any, res: any, next: any, userId: any) => {
    try {
        const userObject = await User.findById(userId);
        if (!userObject) {
            return res.json({success: false, massage: "User not found"});
        }
        req.userProfile = userObject;
        next();
    } catch (error: any) {
        res.json({
            success: false,
            message: "Failed to Update User",
            errorMessage: error.message,
        });
    }
};

export const getSingleUserInfo = async (req: any, res: any) => {
    try {
        const user = req.userProfile;
        return res.json({success: true, user: user});
    } catch (error: any) {
        res.json({
            success: false,
            message: "Failed to Update User",
            errorMessage: error.message,
        });
    }
};

export const updateCurrentUserDetails = async (req: any, res: any) => {
    try {
        let userUpdate = req.body;
        let user = req.userProfile;

        let search = await User.findOne({username: userUpdate.username});

        if (search && search.email !== user.email) {
            return res.json({
                success: false,
                errorMessage: "Username already exists",
            });
        }

        user = extend(user, userUpdate);
        user = await user.save();
        res.json({success: true, user: user});
    } catch (err: any) {
        res.json({
            success: false,
            message: "Failed to Update User",
            errorMessage: err.message,
        });
    }
};

export const follow = async (req: any, res: any) => {
    try {
        const {targetId, sourceId} = req.body;
        const targetUser = await User.findById(targetId);
        if (!targetUser) {
            return res.json({success: false, message: "Invalid Target Id"});
        }
        const sourceUser = await User.findById(sourceId);
        if (!sourceUser) {
            return res.json({success: false, message: "Invalid Source Id"});
        }
        const alreadyExist = targetUser.followers.indexOf(sourceUser._id) === -1 ? false : true;
        if (alreadyExist) {
            return res.status(409).json({
                success: false,
                message: "source user already follows target user",
            });
        }
        await newNotification(targetId, sourceId, "NEW_FOLLOWER", 0);
        targetUser.followers.push(sourceUser._id);
        sourceUser.following.push(targetUser._id);
        await targetUser.save();
        await sourceUser.save();
        return res.json({success: true, targetUserId: targetUser._id});
    } catch (error: any) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const unFollow = async (req: any, res: any) => {
    try {
        const {targetId, sourceId} = req.body;
        const targetUser = await User.findById(targetId);
        if (!targetUser) {
            return res.json({success: false, message: "Invalid Target Id"});
        }
        const sourceUser = await User.findById(sourceId);
        if (!sourceUser) {
            return res.json({success: false, message: "Invalid Source Id"});
        }
        let index = targetUser.followers.indexOf(sourceId);
        if (index === -1) {
            return res.json({
                success: false,
                message: "source user not follows target user",
            });
        }
        targetUser.followers.splice(index, 1);
        index = sourceUser.following.indexOf(targetId);
        sourceUser.following.splice(index, 1);
        await targetUser.save();
        await sourceUser.save();
        return res.json({success: true, targetUserId: targetUser._id});
    } catch (error: any) {
        res.status(500).json({success: false, message: error.message});
    }
};

export const fetchUserPosts = async (req: any, res: any) => {
    try {
        const {userId, clientId} = req.body;
        const user = await User.findById(userId);
        const posts = await Post.find({author: user._id});
        let userPosts = [];

        for (const post of posts) {
            const isLikedByUser = post.likes.some((id: number) => id.toString() === clientId.toString());

            userPosts.push({
                ...post._doc,
                isLikedByUser: isLikedByUser,
                authorName: user.name,
                authorUsername: user.username,
                authorProfileUrl: user.profileUrl,
            });
        }

        return res.json({success: true, posts: userPosts});
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const fetchUserFollowers = async (req: any, res: any) => {
    try {
        const {userId, clientId} = req.body;
        const user = await User.findById(userId);
        const client = await User.findById(clientId);
        const followers = await User.find({_id: {$in: user.followers}}, "_id name username profileUrl");
        let result = [];
        for (const obj of followers) {
            const isFollowedByClient = client.following.some((id: number) => obj.id.toString() === id.toString());
            result.push({...obj._doc, isFollowedByClient});
        }
        return res.json({success: true, followers: result});
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const fetchUserFollowing = async (req: any, res: any) => {
    try {
        const {userId, clientId} = req.body;
        const user = await User.findById(userId);
        const client = await User.findById(clientId);
        const following = await User.find({_id: {$in: user.following}}, "_id name username profileUrl");
        let result = [];
        for (const obj of following) {
            const isFollowedByClient = client.following.some((id: number) => obj.id.toString() === id.toString());
            result.push({...obj._doc, isFollowedByClient});
        }
        return res.json({success: true, following: result});
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const getUserFeed = async (req: any, res: any) => {
    try {
        const user = req.userProfile;
        let tempFeed = [];
        let posts = await Post.find({author: user._id});
        tempFeed.push(posts);
        for (const _user of user.following) {
            posts = await Post.find({author: _user._id});
            tempFeed.push(posts);
        }
        tempFeed = tempFeed.flat();
        let feed = [];
        for (const post of tempFeed) {
            let author = await User.findById(post.author);
            const isLikedByUser = post.likes.some((id: number) => id.toString() === user._id.toString());
            feed.push({
                ...post._doc,
                isLikedByUser: isLikedByUser,
                authorName: author.name,
                authorUsername: author.username,
                authorProfileUrl: author.profileUrl,
            });
        }
        feed.sort((a, b) => {
            return +new Date(b.createdAt) - +new Date(a.createdAt);
        });
        return res.json({success: true, feed: feed});
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({success: false, message: error.message});
    }
};

export const fetchRecentlyJoinedUsers = async (req: any, res: any) => {
    try {
        const user = req.userProfile;
        const users = await User.find(
            {$and: [{_id: {$nin: user.following}}, {_id: {$ne: user._id}}]},
            "id name username profileUrl"
        );
        return res.json({success: true, users: users});
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const searchUser = async (req: any, res: any) => {
    try {
        const search = req.query.text;
        const users = await User.find({$text: {$search: search}}).select("id name username profileUrl email");
        if (users.length === 0) {
            return res.json({success: false, message: "No results"});
        }
        return res.json({success: true, users: users});
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({success: false, message: error.message});
    }
};
export const getUserChats = async (req: any, res: any) => {
    const user = req.userProfile;
    const data = await User.find({_id: {$in: user.chats}}, "_id name username email profileUrl").catch((err: any) =>
        console.log(err)
    );
    return res.status(200).json({success: true, chats: data});
};
