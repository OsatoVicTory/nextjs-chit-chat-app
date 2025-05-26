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

    const chats : ChatListType[] = await getUsers() || [];

    return (
        <Chats chatLists={chats} />
    )
};

