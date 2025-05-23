"use client";

import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import Peer from "simple-peer";
import { Timing, CallProfileImage } from "../../../util/callUtil";
import { AppContext } from "@/context/app";
import styles from "../call.module.css";
import { useRouter } from "next/navigation";
import { FcEndCall } from "react-icons/fc";
import { IoMdCall } from "react-icons/io";

export default function AudioReceive({ backPage } : { backPage: string | undefined }) {

    const router = useRouter();
    const { user, socket, ringing, setRinging } = useContext(AppContext);
    const { callerId, callerName, signal } = ringing || {};
    const receiverId = user.socketId;
    const [callAccepted, setCallAccepted] = useState<boolean>(false);
    const myAudioRef = useRef<HTMLAudioElement | null>(null);
    const userAudioRef = useRef<HTMLAudioElement | null>(null);
    const connectionRef = useRef<Peer.Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const callAcceptedRef = useRef<boolean>(false);
    const callDuration = useRef<number>(0);

    const closePage = useCallback((canRoute = true) => {
        setRinging(null);
        if(canRoute) {
            const back = backPage || "/chat";
            router.push(back);
        }
    }, []);

    const endCall = useCallback((canRoute = true) => {
        if(socket) socket.emit('end-call', { callerId, receiverId, to: callerId, ender: receiverId }); 
        closePage(canRoute);
    }, [socket]);
        
    const answerCall = useCallback(() => {

        if(!streamRef.current || !signal) return;

        connectionRef.current = new Peer({ 
            initiator: false, trickle: false, stream: streamRef.current 
        });
        
        connectionRef.current.on('signal', (data) => {
            socket?.emit('call-accepted', { 
                callerId, receiverId, signal: data, type: 'audio',
                to: callerId, receiverName: user.userName,
            });
        });
        
        connectionRef.current.signal(signal);
        callAcceptedRef.current = true;
        setCallAccepted(true);

        //caller stream
        connectionRef.current.on('stream', (curStream) => {
            if(userAudioRef.current) {
                userAudioRef.current.srcObject = curStream;
                userAudioRef.current?.play();
            }
        });
    }, [signal]);

    useEffect(() => {
        
        if(!ringing) return closePage();

        // only close since in caller side we would have 
        // made call to update in db after 60 secs
        setTimeout(() => {
            if(!callAcceptedRef.current) closePage();
        }, 60000);

        navigator.mediaDevices.getUserMedia({audio: true, video: false})
            .then(curStream => {
                streamRef.current = curStream;
                if(myAudioRef.current) {
                    myAudioRef.current.srcObject = curStream;
                    myAudioRef.current?.play();
                }
                // answerCall();
            }).catch(err => {
                closePage();
            });

        socket?.on('ended-call', (data) => {
            closePage();
        });

    }, [ringing]);

    useEffect(() => {
        return () => {
            const stream = streamRef.current;
            const connection = connectionRef.current;
            if(connection) {
                connection.destroy();
                connectionRef.current = null;
            }
            if(stream) {
                stream.getTracks().forEach((track) => track.stop());
                if(myAudioRef.current) myAudioRef.current.srcObject = null;
                if(userAudioRef.current) userAudioRef.current.srcObject = null;
                streamRef.current = null;
                endCall(false);
            }
        }
    }, []);

    const setDuration = useCallback((time: number) => {
        callDuration.current = time;
    }, []);
    
    return (
        <div className={styles.Call}>
            <div className={styles.Call__Container}>
                <div className={`${styles.Call__main} audio ${callAccepted}`}>

                    <div className={styles.call_top}>
                        <CallProfileImage userName={callerName||""} />
                        <h3 className="text-white">{callerName}</h3>
                        {!callAccepted && <span className='txt-14 text-white'>Incoming...</span>}
                        {callAccepted && <Timing callAccepted={callAccepted} setDuration={setDuration} />}
                    </div>
                    <audio ref={myAudioRef} hidden autoPlay />
                    <audio ref={userAudioRef} hidden autoPlay />
                </div>

                <div className={`${styles.Call__Footer} ${styles.center}`}>
                    <div className={styles.call__Footer}>
                        {!callAccepted && <div className={`${styles.answer} pointer`} onClick={answerCall}>
                            <IoMdCall className={styles.call_icon} />
                        </div>}
                        <div className={`${styles.cancel} pointer`} onClick={() => endCall()}>
                            <FcEndCall className={`${styles.call_icon} ${styles.end_icon}`}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};