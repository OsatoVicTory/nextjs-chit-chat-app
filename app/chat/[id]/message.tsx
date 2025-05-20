"use client";

import { MessageType, UserType } from "@/components/types";
import styles from "../chat.module.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { _genHTML } from "@/app/util/_input";
import { IoCheckmarkDone } from "react-icons/io5";
import WavePlayer from "@/components/wave/wavePlayer";
import MessageCall from "@/components/messageCall/messageCall";

export default function Message({ message, user, chatUserName } : { message: MessageType, user: UserType, chatUserName: string }) {

    const _ref = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<string>("stopped");
    const [playingTime, setPlayingTime] = useState(0);

    useEffect(() => {
        if(_ref.current) {
            if(!message.deleted) {
                const { html } = _genHTML(message.message);
                _ref.current.replaceChildren(html);
            } else {
                _ref.current.innerText = "🚫 Deleted by author";
            }
        }
    }, [message.deleted]);

    const getDate = useMemo(() => {
        const Z = (z : number) => z > 9 ? z : "0"+z;
        const date = new Date(message.date);
        const hr = date.getHours();
        const mins = date.getMinutes();
        return `${Z(hr > 12 ? hr % 12 : hr)}:${Z(mins)} ${hr >= 12 ? "pm" : "am"}`;
    }, []);

    const getUserImg = useMemo(() => {
        if(message.sender === user.socketId) {
            const [firstName, lastName] = user.userName.split(" ");
            return firstName[0] + (lastName ? lastName[0] : "");
        } else {
            const [firstName, lastName] = chatUserName.split(" ");
            return firstName[0] + (lastName ? lastName[0] : "");
        }
    }, []);
    
    const formatTime = useCallback((time: number) => {
        const zeros = (val: number) => val >= 10 ? val : '0'+val;
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${zeros(min)}:${zeros(sec)}`;
    }, []);
    
    return (
        <div className={`${!message.audio ? styles.chat : styles.chat_vn} ${styles[`chat_msg_${message.sender === user.socketId}`]}`}>
            {
                (message.deleted || (!message.audio && !message.call)) ?
                <div className={styles.chat_text} ref={_ref}></div>
                :
                (
                    message.call ?
                    <MessageCall message={message} userId={user.socketId} />
                    :
                    <WavePlayer
                        waveColor={'#A5A4A4'} progressColor={'#25d366'} 
                        waveHeight={39} userImg={getUserImg} _id={message.messageId} audio={message.audio} 
                        state={state} setState={setState} setPlayingTime={setPlayingTime}
                    />
                )
            }
            <div className={`${styles.chat_base_div} ${styles[`cbd_space_between_${message.audio ? true : false}`]}`}>
                {message.audioDuration > 0 && <span className={styles.chat_time}>
                    {!message.deleted ? formatTime(state === 'stopped' ? message.audioDuration : playingTime) : ""}
                </span>}

                <span className={styles.chat_base}>
                    <span className={styles.chat_time}>{getDate}</span>
                    
                    {message.sender === user.socketId && <IoCheckmarkDone 
                    className={`${styles.chat_check} ${styles[`chat_check_${message.read}`]}`} />}
                </span>
            </div>
        </div>
    )
};