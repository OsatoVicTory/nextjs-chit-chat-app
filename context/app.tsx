"use client";

// import ChatList from '@/components/chatList/chatList';
import { ChatListType, DEFAULT_USER, RingingType, UserType, CallingType } from '@/components/types';
import React, { createContext, useState } from 'react';
import { Socket } from 'socket.io-client';


const AppContext = createContext<{
    user: UserType,
    chats: ChatListType[],
    socket: Socket | null,
    ringing: RingingType | null,
    calling: CallingType | null,
    mode: string,
    userSocketId: string,
    setMode: React.Dispatch<string>,
    setSocket: React.Dispatch<Socket | null>,
    setRinging: React.Dispatch<RingingType | null>,
    setCalling: React.Dispatch<CallingType | null>,
    setUser: React.Dispatch<UserType>,
    setChats: React.Dispatch<ChatListType[]>,
    setUserSocketId: React.Dispatch<string>,
}>({
    mode: "light_mode",
    setMode: (prev: string) => {},
    socket: null,
    setSocket: (prev: Socket | null) => {},
    ringing: null,
    setRinging: (prev: RingingType | null) => {},
    calling: null,
    setCalling: (prev: CallingType | null) => {},
    user: DEFAULT_USER,
    setUser: (prev: UserType | null) => {},
    chats: [],
    setChats: (prev: ChatListType[]) => {},
    userSocketId: "",
    setUserSocketId: (prev: string) => {},
});

const AppProvider = ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [userSocketId, setUserSocketId] = useState<string>("");
    const [mode, setMode] = useState<string>("light_mode");
    const [user, setUser] = useState<UserType>(DEFAULT_USER);
    const [chats, setChats] = useState<ChatListType[]>([]);
    const [ringing, setRinging] = useState<RingingType | null>(null);
    const [calling, setCalling] = useState<{receiverId: string, receiverName: string} | null>(null);

    return (
        <AppContext.Provider value={{ 
            user, setUser, chats, setChats, socket, setSocket, calling, setCalling,
            mode, setMode, userSocketId, setUserSocketId, ringing, setRinging }}>
            {children}
        </AppContext.Provider>
    );
};

export { AppContext, AppProvider };