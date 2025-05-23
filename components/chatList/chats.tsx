"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChatListType, DEFAULT_MESSAGE, MessageType, NewMessageType, UserType } from "../types";
import { _formatDate } from "@/util/_util";
import styles from "./side.module.css";
import { AppContext } from "@/context/app";
import { removeUser } from "@/app/actions/db";
import { LuSearch } from "react-icons/lu";
import { MdLogout } from "react-icons/md";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { IoCheckmarkDone } from "react-icons/io5";
import LastChat from "./lastChat";
import Ringing from "../callRinging/ringing";

export default function Chats({ chatLists } : { chatLists: ChatListType[] }) {

    const router = useRouter();
    const pathname = usePathname();
    const { mode, user, chats, socket, setChats, setUserSocketId, setSocket, ringing, setRinging } = useContext(AppContext);
    const ringingRef = useRef<string>("");
    const [userUpdate, setUserUpdate] = useState<{ data: UserType, date: number} | null>(null);
    const [lstChange, setLstChange] = useState<number>(0);
    const [update, setUpdate] = useState<{ 
        message: NewMessageType, time: number, type: string 
    }>({ 
        message: DEFAULT_MESSAGE, time: 1, type: "", 
    });
    const [path, setPath] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");

    useEffect(() => {
        setPath(pathname === "/chat");
    }, [pathname]);
    
    useEffect(() => {
        if(chats.length < 1) setChats(chatLists);
    }, [chats.length]);
    
    useEffect(() => {
        if(update.type === "sendMessage") {
            if(update.message) {
                let cnt = 1;
                setChats(chats.map(chat => {
                    if(chat.socketId === update.message.sender) {
                        return { ...chat, chat: [...chat.chat, update.message], unread: chat.unread + 1, _i: 0 };
                    } else return { ...chat, _i: cnt++ };
                }));
                // setUserSocketId(update.message.sender);
                setUserSocketId(`${update.message.sender}%x2${Date.now()}`);
                setLstChange(Date.now());
            }
        } else if(update.type === "deleteMessage") {
            if(update.message) {
                setChats(chats.map(chat => {
                    // cus only sender can delete, so it is message sender that deleted
                    if(chat.socketId === update.message.sender) {
                        const _chat = chat.chat.map(c => {
                            if(c.messageId === update.message.messageId) {
                                // update.message contains new message with deleted set to true and 
                                // audio set to undefined to free memory space
                                return { ...update.message }; 
                                // return { ...c, deleted: true };
                            } else return c;
                        })
                        return { ...chat, chat: _chat };
                    } else return chat;
                }));
                // setUserSocketId(update.message.sender);
                setUserSocketId(`${update.message.sender}%x2${Date.now()}`);
                setLstChange(Date.now());
            }
        } else if(update.type === "readMessage") {
            if(update.message) {
                setChats(chats.map(chat => {
                    if(chat.socketId === update.message.userSocketId) {
                        const _chat = chat.chat;
                        let i = _chat.length - 1;
                        while(i >= 0 && !_chat[i].read) {
                            _chat[i].read = true;
                            i--;
                        }
                        return { ...chat, chat: _chat };
                    } else return chat;
                }));
                // setUserSocketId(update.message.userSocketId || "");
                setUserSocketId(`${update.message.userSocketId || ""}%x2${Date.now()}`);
                setLstChange(Date.now());
            }
        } else if(update.type === "typingMessage") {
            if(update.message) {
                setChats(chats.map(chat => {
                    if(chat.socketId === update.message.userSocketId) return { ...chat, isTyping: update.message.isTyping || false };
                    else return chat;
                }));
                // setUserSocketId(update.message.userSocketId || "");
                setUserSocketId(`${update.message.userSocketId || ""}%x2${Date.now()}`);
            }
        }
    }, [update.time]);

    useEffect(() => {
        if(userUpdate?.date) {
            const newChats = [];
            let found = false;
            chats.forEach(chat => {
                if(chat.socketId === userUpdate.data.socketId) {
                    newChats.push({ ...chat, lastSeen: userUpdate.data.lastSeen });
                    found = true;
                } else {
                    newChats.push(chat);
                }
            });

            if(found === false) {
                const newChat = { ...userUpdate.data, unread: 0, _i: chats.length, chat: [], isTyping: false };
                newChats.push(newChat);
            }

            setChats(newChats);
        }
    }, [userUpdate?.date]);
    
    useEffect(() => {
        if(socket && user) {
            socket.on("sendMessage", (message: NewMessageType) => {
                setUpdate({ message, time: Date.now(), type: "sendMessage" });
            });

            socket.on("deleteMessage", (message: NewMessageType) => {
                setUpdate({ message, time: Date.now(), type: "deleteMessage" });
            });

            socket.on("readMessage", (message: { userSocketId: string }) => {
                const d = { ...DEFAULT_MESSAGE, ...message };
                setUpdate({ message: d, time: Date.now(), type: "readMessage" });
            });

            socket.on("typingMessage", (message: { userSocketId: string, isTyping: boolean }) => {
                const d = { ...DEFAULT_MESSAGE, ...message };
                setUpdate({ message: d, time: Date.now(), type: "typingMessage" });
            });

            socket.on("userOffline", async (userData: UserType) => {
                setUserUpdate({ data: userData, date: Date.now() });
                setUserSocketId(`${update.message.userSocketId || ""}%x2${Date.now()}`);
            });

            socket.on("userOnline", async (userData: UserType) => {
                setUserUpdate({ data: userData, date: Date.now() });
                setUserSocketId(`${update.message.userSocketId || ""}%x2${Date.now()}`);
            });

            socket.on("call-user", (data) => {
                if(ringingRef.current) {
                    socket.emit('user-in-call', { to: data.callerId });
                    return; // can send socket that user is in call or busy
                }
                setRinging({ ...data, accepted: false });
            });

            socket.on("ended-call", (data) => {
                if(ringingRef.current === data.callerId) setRinging(null);
            });

            socket.on("disconnect", async () => {
                const userData = { ...user, lastSeen: `last seen ${_formatDate(Date.now())}` };
                socket.emit("userOffline", userData);
                await removeUser(userData);
            });
        }
        
        const u = user;
        const s = socket;
        return () => {
            // console.log("calling patch from cleanup-useEffect", u);
            if(!u || !s) return;
            const userData = { ...user, lastSeen: `last seen ${_formatDate(Date.now())}` };
            s?.emit("userOffline", userData);
            removeUser(userData); // this is a promise func but since it is the last thing to run no need to await it
        };

    }, [socket, user]);

    useEffect(() => {
        ringingRef.current = ringing ? ringing.callerId : "";
    }, [ringing]);

    const getProfileAvatar = useCallback((name: string) => {
        if(!update.time) return ""; 
        const [firstName, lastName] = name.split(" ");
        return firstName[0] + (lastName ? lastName[0] : "");
    }, [update.time]);

    const formatDate = useCallback((chat : MessageType[]) => {
        if(!update.time) return ""; 
        else if(chat.length > 0) return _formatDate(chat[chat.length - 1].date);
        else return "";
    }, [update.time]);

    const _byMe = useCallback((chat : MessageType[]) => {
        if(!update.time) return null;
        else if(chat.length > 0) {
            const { sender, read } = chat[chat.length - 1];
            return { read, show: sender === user.socketId };
        } else return null;
    }, [update.time]);

    const handleLogout = useCallback(async () => {
        if(socket && user) {
            const userData = { ...user, lastSeen: `last seen ${_formatDate(Date.now())}` };
            socket.emit("userOffline", userData);
            await removeUser(userData);
            // router.push("/");
            setSocket(null);
            window.location.href = "/";
        }
    }, [socket, user, router]);

    const declineCall = useCallback(() => {
        setRinging(null);
    }, []);

    const searchList = useMemo(() => {
        const s = search.toLowerCase();
        const res: number[] = [];
        let cnt = 0;
        for(let i = 0; i < chats.length; i++) {
            if(chats[i].userName.toLowerCase().startsWith(s)) res[i] = cnt++;
        }
        for(let i = 0; i < chats.length; i++) {
            if(res[i] === undefined) res[i] = cnt++;
        }
        return chats.map((chat, i) => ({ ...chat, _i: res[i] }));
    }, [search, chats]);

    return (
        <aside className={`${styles.Chat_Lists} ${styles[`Chat_Lists_${path}`]}`}>
            <header className="w-full">
                <div className={styles.chat_header}>
                    <div>
                        <div className={styles.profile_avatar}>{getProfileAvatar(user.userName)}</div>
                        <h2 className={styles.txt_white}>Chats</h2>
                    </div>
                    <button className={`${styles.ch_logout} ${styles.pointer} pointer`} onClick={handleLogout}>
                        <MdLogout className={`${styles.ch_icon}`} />
                    </button>
                </div>
                <div className={styles.chat_list_search}>
                    <div className={styles.cl_search}>
                        <LuSearch className={styles.cls_icon} />
                        <input placeholder="Search..." onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
            </header>
            <div className={`${styles.chat_lists_container} w-full`}>
                <div className={`${styles.chat_lists_wrapper} w-full`}>
                    <ul className={styles.chat_lists}>
                        {(search ? searchList : chats).map((chat, idx) => (
                            <li key={`chat-lists-${idx}`} className={styles.chat_list} style={{top: (70 * chat._i) + "px"}}>
                                <Link href={`/chat/${chat.socketId}`} className="w-full">
                                    <div className={`${styles.chat_list_div} w-full`}>
                                        <div className={styles.profile_avatar}>{getProfileAvatar(chat.userName)}</div>
                                        <div className={styles.chat_texts}>
                                            <div className={`${styles.ct_top} w-full`}>
                                                <h3 className={styles.txt_white}>
                                                    {chat.userName + (chat.socketId === user.socketId ? " (YOU)" : "")}
                                                </h3>
                                                <span className={styles.txt_white}>{formatDate(chat.chat)}</span>
                                            </div>
                                            <div className={`${styles.ct_base} w-full`}>
                                                {chat.isTyping ?
                                                    <span className={styles.ct_base_span}>typing...</span> :
                                                    <span className={`${styles.ct_base_span} ${styles.ct_msg}`}>

                                                        {_byMe(chat.chat)?.show && <IoCheckmarkDone 
                                                        className={`${styles._mark} ${styles[`_mark_${_byMe(chat.chat)?.read}`]}`} />}

                                                        <LastChat chat={chat.chat} />
                                                    </span>
                                                }
                                                {chat.unread > 0 && <div className={styles.chat_unread}>{chat.unread}</div>}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {
                (ringing && !ringing?.accepted) && 
                <Ringing callerName={ringing.callerName} callerType={ringing.type} declineCall={declineCall} />
            }

        </aside>
    );
};