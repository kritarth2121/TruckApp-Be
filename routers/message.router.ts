import {deleteChatByRecipientId, getMessages, deleteMessageById} from "../controllers/message.controller";
import express from "express";

const router = express.Router();

router.route("/delete-chat").post(deleteChatByRecipientId);
router.route("/get_messages").post(getMessages);
router.route("/:messageId").delete(deleteMessageById);

export const messageRouter = router;
