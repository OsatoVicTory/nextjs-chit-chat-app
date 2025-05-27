import fs from "fs";
import { ChatListType, UserType } from "@/components/types";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";

interface DBUserType extends UserType {
    user_id: string,
};

interface DBType {
    userName: string,
    lastSeen: string,
    socketId: string
    user_id: string,
}

export async function GET() {
    // const data_ = fs.readFileSync(process.cwd() + "/app/api/chat/db.json", "utf-8");
    // const db = JSON.parse(data_);
    await dbConnect();
    const res: DBType[] = await User.find({});
    const db: ChatListType[] = res.map((_r, _i) => {
        return { 
            userName: _r.userName, lastSeen: _r.lastSeen,
            user_id: _r.user_id, socketId: _r.socketId, 
            _i, unread: 0, isTyping: false, chat: [], 
        }
    });
    return NextResponse.json({ data: db }, { status: 200 });
};

export async function POST(req: NextRequest) {
    await dbConnect();
    const data : DBUserType = await req.json();
    const id = data.user_id;
    const user = await User.findOne({ user_id: id });
    if(user) {
        const _id: string = user._doc._id.toString();
        await User.findByIdAndUpdate(_id, {
            userName: data.userName, socketId: data.socketId,
            user_id: id, lastSeen: "online"
        });
    } else {
        const new_user = { userName: data.userName, socketId: data.socketId, user_id: id, lastSeen: "online" };
        const newUser = new User(new_user);
        await newUser.save();
    }
    // const chatData = { 
    //     userName: data.userName, socketId: data.socketId, unread: 0,
    //     _i: db.length, chat: [], lastSeen: "online", isTyping: false 
    // };
    // fs.writeFileSync(process.cwd() + "/app/api/chat/db.json", JSON.stringify(db, null, 2), "utf-8");
    return NextResponse.json({ data: { status: "success" } }, { status: 200 });
};

export async function PATCH(req: NextRequest) {
    await dbConnect();
    const data : DBUserType = await req.json();
    const id = data.user_id;
    const user = await User.findOne({ user_id: id });
    if(user) {
        const _id: string = user._doc._id.toString();
        await User.findByIdAndUpdate(_id, {
            userName: data.userName, socketId: data.socketId,
            user_id: id, lastSeen: data.lastSeen
        });
    } 
    // let cnt = 0;
    // const data_ = fs.readFileSync(process.cwd() + "/app/api/chat/db.json", "utf-8");
    // const db : ChatListType[] = JSON.parse(data_);
    // const newDb : ChatListType[] = [];
    // db.forEach(_user => {
    //     if(_user.socketId !== data.socketId) {
    //         newDb.push({ ..._user, _i: cnt++ });
    //     } else {
    //         newDb.push({ ..._user, _i: cnt++, lastSeen: data.lastSeen });
    //     }
    // });
    // fs.writeFileSync(process.cwd() + "/app/api/chat/db.json", JSON.stringify(newDb, null, 2), "utf-8");
    return NextResponse.json({ data: { status: "success" } }, { status: 200 });
};