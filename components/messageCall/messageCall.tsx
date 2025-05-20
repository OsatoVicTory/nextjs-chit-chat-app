"use client";

import { MdCall, MdPhoneCallback } from "react-icons/md";
import styles from "./messageCall.module.css";
import { MessageType } from "../types";
import { useMemo } from "react";

export default function MessageCall({ message, userId } : { message: MessageType, userId: string }) {

    const getDuration = useMemo(() => {
        if(message.callDuration) {
            const { callDuration } = message;
            const rem = callDuration % 60;
            if(callDuration <= 60) return `${callDuration} secs`;
            else return `${Math.floor(callDuration / 60)} m${rem > 0 ? (`: ${rem} s`) : ""}`;
        }
        return "0 secs";
    }, [message]);

    return (
        <div className={styles.Message_Call}>
            <div className={styles.Message_Call_Icon}>
                <div>
                    {
                        message.sender === userId ?
                        <MdCall className={`${styles.mci_call_icon} ${styles[`${message.message}`]}`} /> :
                        <MdPhoneCallback className={`${styles.mci_call_icon} ${styles[`${message.message}`]}`} />
                    }
                </div>
            </div>
            <div className={styles.Message_Call_Text}>
                <span className={styles.mct_top}>
                    {`${message.message} ${message.sender === userId ? "Outgoing" : "Incoming"} Call`}
                </span>
                <span className={styles.mct_base}>{`Call lasted for ${getDuration}`}</span>
            </div>
        </div>
    )
};