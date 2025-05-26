"use client";

import { IoCallOutline } from "react-icons/io5";
import { LuVideo } from "react-icons/lu";
import styles from "../../chat.module.css";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "@/context/app";
import Message from "./message";
import { ChatListType, MessageType } from "@/components/types";
import { v4 as uuidv4 } from "uuid";
import ChatFooter from "@/components/chatFooter/footer";
import { MdDelete } from "react-icons/md";
import { useRouter } from "next/navigation";

export default function Chat({ id } : { id: string }) {

    const router = useRouter();
    const { mode, chats, user, socket, userSocketId, setChats, setCalling } = useContext(AppContext);
    const [chat, setChat] = useState<ChatListType | null>(chats.find(chat => chat.socketId === id) || null);
    const [msg, setMsg] = useState<MessageType | null>(null);
    const [change, setChange] = useState<number>(0);

    useEffect(() => {
        if(id) {
            let newChat = null;
            setChats(chats.map((_chat) => {
                if(_chat.socketId === id) {
                    newChat = { ..._chat, unread: 0 };
                    return newChat;
                } else return _chat;
            }));
            if(newChat) setChat(newChat);
        }
        setChange(Date.now());
    }, [id]);

    useEffect(() => {
        if(id && userSocketId.startsWith(id)) {
            let newChat = null;
            setChats(chats.map((_chat) => {
                if(_chat.socketId === id) {
                    newChat = { ..._chat, unread: 0 };
                    return newChat;
                } else return _chat;
            }));
            if(newChat) setChat(newChat);
        }
        setChange(Date.now());
    }, [userSocketId, id]);

    useEffect(() => {
        if(msg && id) {
            setChats(chats.map((chat) => {
                if(chat.socketId === id) return { ...chat, chat: [...chat.chat, msg], unread: 0 };
                else return chat;
            }));
            setChat((prev) => {
                if(prev) return { ...prev, chat: [...prev.chat, msg] };
                else return null;
            });
        }
        setChange(Date.now());
    }, [msg?.date, id]);

    useEffect(() => {
        if(socket && id) {
            socket.emit("readMessage", { reader: user.socketId, receiver: id });
        }
    }, [socket, id]);

    const sendMessage = useCallback((str: string, audio?: Blob, audioDuration?: number) => {
        if(socket && id) {
            const message : MessageType = {
                sender: user.socketId,
                receiver: id,
                message: audioDuration ? "" : str,
                audio: audioDuration ? audio : undefined,
                audioDuration: audioDuration || 0,
                call: "",
                callDuration: 0,
                date: Date.now(),
                read: false,
                deleted: false,
                messageId: uuidv4()
            }
            socket.emit("sendMessage", message);
            // we cannot do setChats(prev => prev.map(...)) cus setChats is from context and does not have 
            // or cannot be set such that setChat: (prev: type[]) => type[], but if it were from useState, it will work
            setMsg(message);
        }
    }, [socket, id]);

    const getProfileAvatar = useMemo(() => {
        if(!chat?.userName) return "";
        const [firstName, lastName] = chat.userName.split(" ");
        return firstName[0] + (lastName ? lastName[0] : "");
    }, [chat?.userName]);

    const handleDelete = useCallback((message: MessageType) => {
        if(socket && id) {
            const m = { ...message, deleted: true, audio: undefined, audioDuration: 0 };
            socket.emit("deleteMessage", m);
            let _chat_ = null;
            setChats(chats.map(chat => {
                if(chat.socketId === id) {
                    const _chat = chat.chat.map(c => {
                        if(c.messageId === message.messageId) return m;
                        else return c;
                    });
                    _chat_ = { ...chat, chat: _chat };
                    return { ...chat, chat: _chat };
                } else return chat;
            }));
            if(_chat_) setChat(_chat_);
            setChange(Date.now());
        }
    }, [socket, id, change]);

    const handleCall = useCallback((type: string) => {
        if(!chat?.userName || !id) return;
        setCalling({ receiverId: id, receiverName: chat.userName });
        router.push(`/chat/call/${type}_call?back=/chat/c/${id}`);
    }, [chat?.userName, id]);

    return (
        <>
        {
            !chat?.userName ?
            <div className={`${styles.chat_Main} ${styles[mode]} w-full h-full`}>
                <h1>No User match Id</h1>
            </div>
            :
            <div className={`${styles.chat_Main} ${styles[mode]} w-full h-full`}>
                <header>
                    <div className={styles.header_profile}>
                        <div>
                            <div className={styles.header_avatar}>{getProfileAvatar}</div>
                            <div className={styles.header_txts}>
                                <span className={`${styles.header_name} txt-white`}>
                                    {chat.userName + (chat.socketId === user.socketId ? " (YOU)" : "")}
                                </span>
                                {chat.isTyping ? 
                                    <span className={`green-text`}>typing...</span> :
                                    <span className={`${styles.last_seen} txt-white`}>{chat.lastSeen}</span>
                                }
                            </div>
                        </div>
                        <div className={styles.header_icons}>
                            <button className={styles.header_icon_btns} onClick={() => handleCall("video")}>
                                <LuVideo className={styles.header_icon} />
                            </button>
                            <button className={styles.header_icon_btns} onClick={() => handleCall("audio")}>
                                <IoCallOutline className={styles.header_icon} />
                            </button>
                            {/* <button className={styles.header_icon_btns}>
                                <AiOutlineSearch className={styles.header_icon} />
                            </button> */}
                        </div>
                    </div>
                </header>
                <main>
                    <div className={`${styles.main_chat} w-full`}>
                        <ul className={styles.main_chat_lists}>
                            {chat?.chat && chat.chat.map((message, idx) => (
                                <li className={`${styles.main_chat_list} w-full`} key={`message-${idx}`}>
                                    <div className={`${message.sender === user.socketId ? styles.By_You : styles.By_Others} ${styles[`By_You_deleted_${message.deleted}`]}`}>
                                        <div className={styles.main_chat_msg}>
                                            {(message.sender === user.socketId && !message.deleted) &&
                                            <button className={`${styles.delete_button} pointer`} 
                                            onClick={() => handleDelete(message)}>
                                                <MdDelete className={styles.delete_button_icon} />
                                            </button>}
                                            <Message message={message} user={user} chatUserName={chat.userName} />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </main>
                <footer>
                    {(user && id) &&<div className={`${styles.chat_footer_wrapper} w-full`}>
                        <ChatFooter sendMessage={sendMessage} socket={socket} user={user} id={id} />
                    </div>}
                </footer>
            </div>
        }
        </>
    );
};