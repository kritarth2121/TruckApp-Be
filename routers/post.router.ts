import express from "express";
const router = express.Router();
import { createPost, likePost, commentPost, deletePost, unlikePost, fetchLikes, fetchSinglePost, updatePost, deleteComment, fetchComments } from "../controllers/post.controller";

router.route("/new").post(createPost);
router.route("/like").post(likePost);
router.route("/unlike").post(unlikePost);
router.route("/comment").post(commentPost);
router.route("/comment/:commentId").delete(deleteComment);
router.route("/:postId").get(fetchSinglePost);
router.route("/likes/:postId").get(fetchLikes);
router.route("/update-post").put(updatePost);
router.route("/comments/:postId").get(fetchComments);
router.route("/delete/:postId").delete(deletePost);

export const postRouter = router;
