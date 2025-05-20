import fs from "fs";
import { ChatListType, UserType } from "@/components/types";
import { NextRequest, NextResponse } from "next/server";

interface DBUserType extends UserType {
    cache_id: string,
};

export async function GET() {
    const data_ = fs.readFileSync("./app/api/chat/db.json", "utf-8");
    const db = JSON.parse(data_);
    return NextResponse.json({ data: db }, { status: 200 });
};

export async function POST(req: NextRequest) {
    const data : DBUserType = await req.json();
    const data_ = fs.readFileSync("./app/api/chat/db.json", "utf-8");
    const db = JSON.parse(data_);
    const id = data.cache_id;
    const chatData = { 
        userName: data.userName, socketId: data.socketId, unread: 0,
        _i: db.length, chat: [], lastSeen: "online", isTyping: false 
    };
    let seen = false;
    for(let i = 0; i < db.length; i++) {
        if(db[i].socketId === id) {
            const { _i } = db[i];
            db[i] = chatData;
            db[i]._i = _i;
            seen = true;
            break;
        } 
    }
    if(!seen) db.push(chatData);
    fs.writeFileSync("./app/api/chat/db.json", JSON.stringify(db, null, 2), "utf-8");
    return NextResponse.json({ data: { status: "success" } }, { status: 200 });
};

export async function PATCH(req: NextRequest) {
    const data : UserType = await req.json();
    let cnt = 0;
    const data_ = fs.readFileSync("./app/api/chat/db.json", "utf-8");
    const db : ChatListType[] = JSON.parse(data_);
    const newDb : ChatListType[] = [];
    db.forEach(_user => {
        if(_user.socketId !== data.socketId) {
            newDb.push({ ..._user, _i: cnt++ });
        } else {
            newDb.push({ ..._user, _i: cnt++, lastSeen: data.lastSeen });
        }
    });
    fs.writeFileSync("./app/api/chat/db.json", JSON.stringify(newDb, null, 2), "utf-8");
    return NextResponse.json({ data: { status: "success" } }, { status: 200 });
};