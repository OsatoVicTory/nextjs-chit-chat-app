import { useRef, useState, useEffect, useMemo } from 'react';
import styles from "@/app/chat/call/call.module.css";

export function Timing({ callAccepted, setDuration } : { callAccepted: boolean, setDuration: (time: number) => void }) {

    const [callTime, setCallTime] = useState(0);
    const timeInterval = useRef<NodeJS.Timeout | null>(null);

    const formatTimeInSecs = useMemo(() => {
        let t = callTime;
        const fixZeros = (v: number) => v >= 10 ? v : '0'+v;
        let res = '';
        res += Math.floor(t / 3600) + 'h: ';
        t %= 3600;
        res += fixZeros(Math.floor(t / 60)) + 'm: ';
        t %= 60;
        res += fixZeros(t) + 's';
        return res;
    }, [callTime]);

    useEffect(() => {
        if(callAccepted) {
            timeInterval.current = setInterval(() => {
                setCallTime(prev => {
                    setDuration(prev + 1);
                    return prev + 1;
                });
            }, 1000);
        }
        return () => {
            if(timeInterval.current) clearInterval(timeInterval.current);
        }
    }, [callAccepted]);

    return (
        <h2 className={`${styles.call_timer} text-white`}>{formatTimeInSecs}</h2>
    )
};

export function CallProfileImage({ userName } : { userName: string }) {
    const [firstName, lastName] = userName.split(" ");
    const str = firstName[0] + (lastName ? lastName[0] : "");

    return (
        <div className={styles.callProfileImage}>{str}</div>
    )
};