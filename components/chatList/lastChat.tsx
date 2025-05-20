"use client";

import { useEffect, useRef } from "react";
import { MessageType } from "../types";
import { _genHTMLForList } from "@/app/util/_input";
import styles from "./side.module.css";

export default function LastChat({ chat } : { chat: MessageType[] }) {

    const spanRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        if(spanRef.current && chat.length > 0) {
            const { message, deleted, audioDuration, call } = chat[chat.length - 1]; //"⛔","🚫"
            if(deleted) spanRef.current.innerHTML = "🚫 Deleted by author";
            else if(audioDuration > 0) spanRef.current.innerHTML = "🎤 Voice note";
            else if(call) spanRef.current.innerHTML = "📞 Call";
            else spanRef.current.replaceChildren(_genHTMLForList(message));
        } 
    }, [JSON.stringify(chat[Math.max(0, chat.length - 1)])]);

    return (
        <span className={styles.txt_white} ref={spanRef}></span>
    )
};