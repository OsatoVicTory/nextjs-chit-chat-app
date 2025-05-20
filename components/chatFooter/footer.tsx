"use client";

import useTextEditor from "@/app/hooks/_textEditor";
import styles from "./editor.module.css";
import { useCallback, useRef, useState } from "react";
import { MdKeyboardArrowUp } from "react-icons/md";
import { e_ctrls } from "@/app/util/_input";
import { sendMessageType, UserType } from "../types";
import { BsEmojiSmile, BsFillMicFill, BsSend } from "react-icons/bs";
import EmojiPicker from "../emojiPicker/picker";
import { Socket } from "socket.io-client";
import WaveCapture from "../wave/waveCapture";

export default function ChatFooter(
    { sendMessage, socket, user, id } : 
    { sendMessage: sendMessageType, socket: Socket | null, user: UserType, id: string }
) {
    
    const [filled, setFilled] = useState<boolean>(false);
    const [mic, setMic] = useState<boolean>(false);
    const inputref = useRef<HTMLDivElement | null>(null);
    const placeholderref = useRef<HTMLSpanElement | null>(null);
    const [frags, setFrags] = useState<{ data: string[], changed: number }>({ data: [], changed: 0 }); 
    const [showEmoji, setShowEmoji] = useState<boolean>(false);
    const [showControls, setShowControls] = useState<boolean>(false);
    const typing = useRef<boolean>(false);
    const filledRef = useRef<boolean>(false);
    const typedmessage = useRef<string>("");

    const strFn = useCallback((str: string) => {
        typedmessage.current = str;
        if((str && !filledRef.current) || (!str && filledRef.current)) {
            filledRef.current = str ? true : false;
            setFilled(filledRef.current);
        }
        if(socket && !typing.current) {
            socket.emit("typingMessage", { receiver: id, typer: user.socketId, isTyping: true });
            typing.current = true;
        }
    }, [socket]);

    const blurFn = useCallback(() => {
        if(socket && typing.current) {
            socket.emit("typingMessage", { receiver: id, typer: user.socketId, isTyping: false });
            typing.current = false;
        }
    }, [socket]);

    const { selFn, emojiClickFn, clearFn } = useTextEditor(
        inputref, placeholderref, strFn, blurFn, (res: string[]) => setFrags({ data: res, changed: Date.now() })
    ); 

    const isSelected = useCallback((ele : string) => {
        return frags.data.find(v => v === ele);
    }, [frags.changed]);

    const sendMessageFn = useCallback(() => {
        if(!typedmessage.current) return setMic(true);
        sendMessage(typedmessage.current, undefined, 0);
        clearFn();
        if(socket) {
            socket.emit("typingMessage", { receiver: id, typer: user.socketId, isTyping: false });
        }
    }, [socket]);

    const sendVN = useCallback((audioStr: Blob, durationTime: number) => {
        sendMessage("", audioStr, durationTime);
        setMic(false);
    }, []);

    return (
        <div className={`w-full`}>

            {showEmoji && <EmojiPicker emojiClick={emojiClickFn} />}

            {mic && <div className={`${`${styles.chat_footer} ${styles.chat_footer_mic}`} w-full`}>
                <div className={styles.footer_mic}>
                    <WaveCapture close={() => setMic(false)} sendVN={sendVN} />
                </div>
            </div>}

            <div className={`${styles.chat_footer} ${styles[`chat_footer_${!mic}`]} w-full`}>
                <button className={`${styles.emoji_btn} pointer`} onClick={() => setShowEmoji(!showEmoji)}>
                    <BsEmojiSmile className={styles.emoji_icon} />
                </button>
                <div className={styles.chat_footer_input}>
                    <div className={styles.text_Editor}>
                        <div className={`${styles.text_Editor_div} w-full`}>
                            <div className={styles.parentContentEditable} contentEditable="true" ref={inputref}
                            suppressContentEditableWarning={true} spellCheck="true" role="textbox">
                                <div className={styles.div_Parent}>
                                    <p className={styles.p_start}><br /></p>
                                </div>
                            </div>
                            <span className={styles.text_placeholder} ref={placeholderref}>Type message</span>
                        </div>
                        <div className={styles.editor_Controller}>
                            <div className={`${styles.editor_Controls} ${styles[`editor_Controls_${showControls}`]}`}>
                                <div className={styles.editor_Controls_div}>
                                    {e_ctrls.map((_ctrl, idx) => (
                                        <button key={`ctrls-${idx}`} disabled={isSelected(_ctrl.className) ? true : false}
                                        className={`
                                            ${styles.editor_Control} 
                                            ${styles[`editor_Control_${isSelected(_ctrl.className) || ""}`]}
                                        `}
                                        onClick={() => selFn(_ctrl.className)}>
                                            <ButtonComponent ele={_ctrl.ele} className={_ctrl.className} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button className={styles.editor_Controls_open_close} onClick={() => setShowControls(!showControls)}>
                                <MdKeyboardArrowUp className={styles.ecoc_icon} />
                            </button>
                        </div>
                    </div>
                </div>
                <button className={styles.footer_btn} onClick={sendMessageFn}>
                    {!filled ?
                    <BsFillMicFill className={styles.footer_btn_icon} /> :
                    <BsSend className={styles.footer_btn_icon} />}
                </button>
            </div>
        </div>
    );
};


const ButtonComponent = ({ ele, className } : { ele: string, className: string }) => {
    if(ele === "strong") return <strong className={styles[className]}>Strong</strong>
    else if(ele === "i") return <i className={styles[className]}>Italics</i>
    else if(ele === "strike") return <span className={styles[className]}>Line through</span>
    else if(ele === "code") return <code className={styles[className]}>Code</code>
    else if(ele === "mark") return <mark className={styles[className]}>Highlight</mark>
    else if(ele === "u") return <u className={styles[className]}>Under line</u>
    else if(ele === "blockquote") return <blockquote className={styles[className]}>Quote</blockquote>
    else return <li className={styles[className]}>Lists</li>
}