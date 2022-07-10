import express from "express";

const router = express.Router();
const {getMessages, deleteMessageById, deleteChatByRecipientId} = require("../controllers/message.controller");

router.route("/delete-chat").post(deleteChatByRecipientId);
router.route("/get_messages").post(getMessages);
router.route("/:messageId").delete(deleteMessageById);

export const messageRouter = router;
