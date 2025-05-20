"use client";

import { HiPhoneMissedCall } from "react-icons/hi";
import styles from "./ringing.module.css";
import { MdWifiCalling3 } from "react-icons/md";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useContext } from "react";
import { AppContext } from "@/context/app";

export default function Ringing({ 
    callerName, callerType, declineCall 
} : { 
    callerName: string, callerType: string, declineCall: () => void 
}) {

    const pathname = usePathname();
    const router = useRouter();
    const { ringing, setRinging } = useContext(AppContext);

    const acceptCall = useCallback(() => {
        if(ringing) {
            setRinging({ ...ringing, accepted: true });
            router.push(`/chat/call/${callerType}_receive?back=${pathname}`);
        }
    }, [ringing]);

    return (
        <div className={styles.Ringing}>
            <div className={styles.ringing}>
                <h3>{`Incoming ${callerType} call from ${callerName}`}</h3>
                <div className={styles.ringing_btns}>
                    <button className={`${styles.btn} ${styles.reject_btn} pointer`} onClick={declineCall}>
                        <HiPhoneMissedCall className={styles.btn_icon} />
                    </button>

                    <button className={`${styles.btn} ${styles.accept_btn} pointer`} onClick={acceptCall}>
                        <MdWifiCalling3 className={styles.btn_icon} />
                    </button>
                </div>
            </div>
        </div>
    )
}