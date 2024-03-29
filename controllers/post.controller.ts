import {Post} from "../models/post.model";
import {User} from "../models/user.model";
import {newNotification} from "./notification.controller";
import {Comment} from "../models/comment.model";

export const createPost = async (req: {body: {author: any; content: any}}, res: any) => {
    const {author, content} = req.body;
    try {
        const user = await User.findById(author);
        if (!user) {
            return res.json({success: false, massage: "User not found"});
        }
        let newPost = new Post({author: author, content: content});
        await newPost.save();
        return res.status(200).json({
            success: true,
            message: "post created",
            post: {
                ...newPost._doc,
                authorName: user.name,
                authorUsername: user.username,
                authorProfileUrl: user.profileUrl,
            },
        });
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const fetchSinglePost = async (req: {params: {postId: any}}, res: any) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);
        const user = await User.findById(post.author);
        return res.status(200).json({
            success: true,
            message: "requested post fetched",
            post: {
                ...post._doc,
                authorName: user.name,
                authorUsername: user.username,
                authorProfileUrl: user.profileUrl,
            },
        });
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const updatePost = async (req: {body: {postId: any; content: any}}, res: any) => {
    try {
        const {postId, content} = req.body;
        const post = await Post.findById(postId);
        const user = await User.findById(post.author);
        post.content = content;
        await post.save();
        return res.status(200).json({
            success: true,
            message: "requested post fetched",
            post: {
                ...post._doc,
                authorName: user.name,
                authorUsername: user.username,
                authorProfileUrl: user.profileUrl,
            },
        });
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const likePost = async (req: {body: {userId: any; postId: any}}, res: any) => {
    const {userId, postId} = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.json({success: false, massage: "User not found"});
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.json({success: false, massage: "User not found"});
        }
        await newNotification(post.author, user._id, "LIKED", postId);
        post.likes.push(user._id);
        await post.save();
        return res.status(200).json({
            success: true,
            message: "post liked",
            postId: post._id,
            likedBy: {_id: user._id, name: user.name, username: user.username},
        });
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const unlikePost = async (req: {body: {userId: any; postId: any}}, res: any) => {
    const {userId, postId} = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.json({success: false, massage: "User not found"});
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.json({success: false, massage: "User not found"});
        }
        const index = post.likes.indexOf(user._id);
        post.likes.splice(index, 1);
        await post.save();
        return res.status(200).json({
            success: true,
            message: "post disliked",
            unlikeBy: user._id,
            postId: post._id,
        });
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const commentPost = async (req: {body: {userId: number; postId: number; comment: string}}, res: any) => {
    const {userId, postId, comment} = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.json({success: false, massage: "User not found"});
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.json({success: false, massage: "User not found"});
        }
        let newComment = new Comment({
            comment: comment,
            commentBy: user._id,
            postId: post._id,
        });
        newComment = await newComment.save();
        post.comments.push(newComment._id);
        await post.save();
        await newNotification(post.author, user._id, "NEW_COMMENT", postId);
        return res.status(200).json({
            success: true,
            message: "comment added",
            comment: {
                ...newComment._doc,
                commenterName: user.name,
                commenterUsername: user.username,
                commenterProfileUrl: user.profileUrl,
            },
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({success: false, message: error.message});
    }
};

export const deleteComment = async (req: {params: {commentId: any}}, res: any) => {
    const commentId = req.params.commentId;
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.json({success: false, massage: "comment not found"});
        }
        const post = await Post.findById(comment.postId);
        if (!post) {
            return res.json({success: false, massage: "User not found"});
        }
        await Comment.findByIdAndDelete(comment._id);
        const index = post.comments.indexOf(commentId);
        post.comments.splice(index, 1);
        await post.save();
        return res.status(200).json({
            success: true,
            message: "comment deleted",
            commentId: commentId,
        });
    } catch (error: any) {
        console.log(error);
        return res.status(500).json({success: false, message: error.message});
    }
};

export const deletePost = async (req: {params: {postId: any}}, res: any) => {
    try {
        const postId = req.params.postId;
        await Post.findByIdAndDelete(postId);
        return res.status(200).json({success: true, message: "post deleted", postId: postId});
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const fetchLikes = async (req: {params: {postId: any}}, res: any) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.json({
                success: false,
                message: "Invalid Id, post not found",
            });
        }
        const likes = await User.find({_id: {$in: post.likes}}, "_id name username profileUrl");
        return res.status(200).json({success: true, likes: likes});
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};

export const fetchComments = async (req: {params: {postId: any}}, res: any) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.json({
                success: false,
                message: "Invalid Id, post not found",
            });
        }
        const comments = await Comment.find({postId: post._id});
        let result = [];
        for (const comment of comments) {
            const user = await User.findById(comment.commentBy);
            result.push({
                ...comment._doc,
                commenterName: user.name,
                commenterUsername: user.username,
                commenterProfileUrl: user.profileUrl,
            });
        }
        return res.status(200).json({success: true, comments: result});
    } catch (error: any) {
        return res.status(500).json({success: false, message: error.message});
    }
};
