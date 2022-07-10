import crypto from "crypto";
import {Message} from "../models/message.model";
import {User} from "../models/user.model";

export const encrypt = (message: any) => {
    // key to encrypt and decrypted  (random 32 Bytes)
    const key = crypto.randomBytes(32);
    //iv - initialization vector (random 16 Bytes)
    const iv = crypto.randomBytes(16);
    // cipher function to encrypt the message
    // aes-256-cbc algorithm to encrypt and decrypt the data.
    let cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
    let encryptedMessage = cipher.update(message);
    encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);
    return {
        iv: iv.toString("hex"),
        encryptedMessage: encryptedMessage.toString("hex"),
        key: key.toString("hex"),
    };
};

export const createMessage = async (senderId: any, receiverEmail: any, message: {createdAt: any}) => {
    let info = null;
    let isNewRecipient = false;
    const user = await User.findOne({_id: senderId}).catch((err) => {
        console.log(err);
    });
    if (user) {
        const receiver = await User.findOne({email: receiverEmail});
        if (receiver) {
            if (!receiver.chats.includes(senderId)) {
                isNewRecipient = true;
                receiver.chats.push(senderId);
                await receiver.save();
            }
            const encryptedMessage = encrypt(message);
            const newMessage = new Message({
                sender: senderId,
                receiver: receiver._id,
                message: encryptedMessage.encryptedMessage,
                iv: encryptedMessage.iv,
                key: encryptedMessage.key,
            });
            await newMessage.save();
            info = {
                sender: {
                    name: user.name,
                    email: user.email,
                    _id: user._id,
                    profileUrl: user.profileUrl,
                    username: user.username,
                },
                receiver: {
                    name: receiver.name,
                    _id: receiver._id,
                    email: receiver.email,
                    profileUrl: receiver.profileUrl,
                    username: receiver.username,
                },
                iv: newMessage.iv,
                key: newMessage.key,
                message: newMessage.message,
                createdAt: message.createdAt,
                messageId: newMessage._id,
            };
        }
    }
    return {info, isNewRecipient};
};

export const startMessage = async (senderId: any, receiverEmail: any) => {
    const user = await User.findOne({_id: senderId});
    if (user) {
        const receiver = await User.findOne({email: receiverEmail});
        if (receiver) {
            if (!user.chats.includes(senderId) && user._id !== receiver._id) {
                user.chats.push(receiver._id);
                await user
                    .save()
                    .then(() => {
                        return true;
                    })
                    .catch(() => {
                        return null;
                    });
            }
        } else {
            return null;
        }
    } else {
        return null;
    }
};

export const getMessages = (
    req: {body: {userId: any; receiverId: any}},
    res: any
) => {
    const {userId, receiverId} = req.body;
    User.findOne({_id: userId}, (err: {message: any}, user: {name: any; email: any; _id: any}) => {
        if (err) {
            return res.status(500).json({success: false, message: err.message});
        } else if (!user) {
            return res.json({success: false, message: "user not exist"});
        } else {
            User.findOne({_id: receiverId}, (err: {message: any}, receiver: {name: any; email: any; _id: any}) => {
                if (err) {
                    return res.status(500).json({success: false, message: err.message});
                } else if (!receiver) {
                    return res.status(205).json({success: false, message: "receiver not exist"});
                } else {
                    Message.find({sender: userId, receiver: receiverId})
                        .then((messagesSentBySender) => {
                            Message.find({sender: receiverId, receiver: userId}, (err, messagesSentByReceiver) => {
                                let conversation = messagesSentBySender.concat(messagesSentByReceiver);
                                conversation.sort((a, b) => {
                                    return +new Date(a.createdAt) - +new Date(b.createdAt);
                                });
                                let result: {
                                    sender: {name: any; email: any; _id: any};
                                    receiver: {name: any; email: any; _id: any};
                                    iv: any;
                                    key: any;
                                    message: any;
                                    createdAt: any;
                                    messageId: any;
                                }[] = [];
                                conversation.forEach((message) => {
                                    let info;
                                    if (String(message.sender) === String(userId)) {
                                        info = {
                                            sender: {
                                                name: user.name,
                                                email: user.email,
                                                _id: user._id,
                                            },
                                            receiver: {
                                                name: receiver.name,
                                                email: receiver.email,
                                                _id: receiver._id,
                                            },
                                            iv: message.iv,
                                            key: message.key,
                                            message: message.message,
                                            createdAt: message.createdAt,
                                            messageId: message._id,
                                        };
                                    } else {
                                        info = {
                                            receiver: {
                                                name: user.name,
                                                email: user.email,
                                                _id: user._id,
                                            },
                                            sender: {
                                                name: receiver.name,
                                                email: receiver.email,
                                                _id: receiver._id,
                                            },
                                            iv: message.iv,
                                            key: message.key,
                                            createdAt: message.createdAt,
                                            message: message.message,
                                            messageId: message._id,
                                        };
                                    }
                                    result.push(info);
                                });
                                return res.json({success: true, messages: result});
                            });
                        })
                        .catch((err) => {
                            console.log(err);
                            return res.json({success: false, message: err.message});
                        });
                }
            });
        }
    });
};

export const deleteMessageById = (
    req: {params: {messageId: any}},
    res: any
) => {
    const {messageId} = req.params;
    Message.findByIdAndDelete(messageId)
        .then(() => {
            return res.json({
                success: true,
                message: "message deleted",
                messageId: messageId,
            });
        })
        .catch((err) => {
            console.log(err);
            return res.json({success: false, message: err.message});
        });
};

const deleteMessages = (senderId: any, receiverId: any) => {
    Message.deleteMany({sender: senderId, receiver: receiverId})
        .then(() => {
            Message.deleteMany({
                receiver: senderId,
                sender: receiverId,
            })
                .then(() => {
                    return true;
                })
                .catch((err) => {
                    console.log(err);
                    return false;
                });
        })
        .catch((err) => {
            console.log(err);
            return false;
        });
};

export const deleteChatByRecipientId = async (
    req: {body: {senderId: any; recipientId: any}},
    res: any
) => {
    const {senderId, recipientId} = req.body;

    const user = await User.findOne({_id: senderId}).catch((err) => {
        return res.json({success: false, message: err.message});
    });
    deleteMessages(senderId, recipientId);
    if (user) {
        const index = user.chats.indexOf(recipientId);
        console.log(user.chats);
        user.chats.splice(index, 1);
        console.log(user.chats);
        await user.save();
        return res.json({success: true, recipientId: recipientId});
    }
    return res.json({success: false, message: "something is wrong"});
};
