import { ChatListType, UserType } from "@/components/types";

const URL = "https://nextjs-chit-chat-app.vercel.app";

export const getUsers = async () : Promise<ChatListType[] | string> => {
    try {
        const res = await fetch(`${URL}/api/chat`);
        const json = await res.json();
        return json.data;
    } catch(err) {
        return "failed";
    }
};

interface DBUserType extends UserType {
    user_id: string,
};

export const addNewUser = async (data: DBUserType) : Promise<string> => {
    try {
        const chatData = { 
            userName: data.userName, socketId: data.socketId, unread: 0, user_id: data.user_id,
            _i: 0, chat: [], lastSeen: "online", isTyping: false // in api route page _i is set to db.length
        };
        const res = await fetch(`${URL}/api/chat`, {
            method: "POST",
            body: JSON.stringify(chatData),
        });
        return "success";
    } catch (err) {
        return "failed";
    }
};

export const updateUser = async (data: DBUserType) : Promise<string> => {
    try {
        const res = await fetch(`${URL}/api/chat`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
        return "success";
    } catch(err) {
        return "failed";
    }
};