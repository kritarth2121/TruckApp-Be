require("dotenv").config();
const port = process.env.PORT || 8080;
import express from "express";
import cors from "cors";
import http from "http";
import socketio from "socket.io";
import {initializeDBConnection} from "./config/db.config";
import {postRouter} from "./routers/post.router";
import {messageRouter} from "./routers/message.router";
import {authenticate} from "./middleware/authenticate";
import {createMessage, startMessage} from "./controllers/message.controller";
import {userRouter} from "./routers/user.router";
import {journeyRouter} from "./routers/journey.router";

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = (socketio as any)(server, {cors: true});
// called before any route
initializeDBConnection();

app.use("/users", userRouter);
app.use("/posts", authenticate, postRouter);
app.use("/messages", authenticate, messageRouter);
app.use("/journeys", authenticate, journeyRouter);
app.get("/test", (req, res) => {
    return res.send({message: "Welcome"});
});

let connectedUsers = new Map();

io.on("connection", (socket: any) => {
    let {id} = socket.client;

    socket.on("connectUser", ({name}: any) => {
        //  When the client sends 'name', we store the 'name',
        //  'socket.client.id', and 'socket.id in a Map structure
        connectedUsers.set(name, [socket.client.id, socket.id]);
        io.emit("onlineUsers", Array.from(connectedUsers.keys()));
    });

    socket.on("disconnect", () => {
        for (let key of connectedUsers.keys()) {
            if (connectedUsers.get(key)[0] === id) {
                connectedUsers.delete(key);
                break;
            }
        }
        io.emit("onlineUsers", Array.from(connectedUsers.keys()));
    });

    socket.on("startMessage", ({senderId, receiverEmail}: any) => {
        startMessage(senderId, receiverEmail);
    });

    socket.on("sendMessage", ({sender, receiver, message}: any) => {
        const {email, name} = receiver;
        let receiverSocketId = connectedUsers.get(name) === undefined ? false : connectedUsers.get(name)[1];
        let senderSocketId = connectedUsers.get(sender.name)[1];
        createMessage(sender._id, email, message).then(({info, isNewRecipient}: any) => {
            if (isNewRecipient && receiverSocketId) {
                io.to(receiverSocketId).emit("newRecipient", info.sender);
            } else if (receiverSocketId) {
                io.to(receiverSocketId).emit("message", info);
            }
            io.to(senderSocketId).emit("message", info);
        });
    });
});

server.listen(port, () => {
    console.log(`server is running on port ${port}`);
});
