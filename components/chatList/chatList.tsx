import { Suspense } from "react";
import { ChatListType } from "../types";
import Chats from "./chats";
import { getUsers } from "@/app/actions/db";
import ChatsLoading from "./chatsLoading";


export default function ChatList() {

    return (
        <Suspense fallback={<ChatsLoading />}>
            <ChatsParent />
        </Suspense>
    )
};

async function ChatsParent() {

    const res : ChatListType[] | string = await getUsers() || "";
    const chats : ChatListType[] = typeof res === "string" ? [] : res;

    if(res === "failed" || res === "") {
        return (
            <div className="w-full h-full">
                <h1>Failed to load data</h1>
            </div>
        )
    } else {
        return (
            <Chats chatLists={chats} />
        )
    }
};

