"use client";

import { useState, useRef, useEffect, useCallback, useContext, Suspense } from 'react';
import Peer, { SignalData } from "simple-peer";
import { CallProfileImage, Timing } from '../../../util/callUtil';
import { AppContext } from '@/context/app';
import styles from "../call.module.css";
import { useRouter, useSearchParams } from 'next/navigation';
import { FcEndCall } from 'react-icons/fc';
import { MessageType } from '@/components/types';
import { v4 as uuidv4 } from "uuid";
import Skeleton from '@/components/chatList/skeleton';


function AudioCallLoading() {

    return (
        <div className={styles.Call}>
            <div className={styles.Call__Container}>
                <div className={`${styles.Call__main} audio ${styles.Call__main__loading}`}>
                    <div className={styles.callProfileImage_loading}><Skeleton /></div>
                    <h3 className="text-white">Loading...</h3>
                </div>
            </div>
        </div>
    )
};


function AudioCall() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, socket, calling, setCalling, chats, setChats } = useContext(AppContext);
    const { receiverId, receiverName } = calling || {};
    const callerId = user.socketId;
    const callerName = user.userName;
    const [callAccepted, setCallAccepted] = useState<boolean>(false);
    const myAudioRef = useRef<HTMLAudioElement | null>(null);
    const userAudioRef = useRef<HTMLAudioElement | null>(null);
    const connectionRef = useRef<Peer.Instance | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const acceptedRef = useRef<boolean>(false);
    const [streamReady, setStreamReady] = useState<boolean>(false);
    const callDuration = useRef<number>(0);
    const alreadySending = useRef<boolean>(false);
    
    const closePage = useCallback((canRoute = true) => {
        if(!alreadySending.current && receiverId) {
            alreadySending.current = true;
            const message : MessageType = {
                sender: user.socketId,
                receiver: receiverId,
                message: (callAccepted ? "accepted" : "missed"),
                audio: undefined,
                audioDuration: 0,
                call: `audio`,
                callDuration: callDuration.current,
                date: Date.now(),
                read: false,
                deleted: false,
                messageId: uuidv4()
            }
            socket?.emit("sendMessage", message);
            setChats(chats.map((chat) => {
                if(chat.socketId === receiverId) return { ...chat, chat: [...chat.chat, message], unread: 0 };
                else return chat;
            }));
        }

        setCalling(null);

        if(canRoute) {
            const back = searchParams.get("back") || "/chat";
            router.push(back);
        }
    }, [callAccepted]);

    const endCall = useCallback((canRoute = true) => {
        socket?.emit('end-call', { callerId, receiverId, to: receiverId, ender: callerId }); 
        closePage(canRoute);      
    }, []);

    useEffect(() => {
        
        if(!calling) return closePage();

        navigator.mediaDevices.getUserMedia({audio: true, video: false}) // for audio video will be false
        .then(curStream => {
            streamRef.current = curStream;
            if(!streamReady) setStreamReady(true);
            if(myAudioRef.current) {
                myAudioRef.current.srcObject = curStream;
                myAudioRef.current?.play();
            }
        }).catch(err => {
            closePage();
        });

        socket?.on('user-in-call', (data: { to: string }) => {
            closePage();
        });

        socket?.on('ended-call', () => {
            closePage();
        });

    }, [calling]);

    useEffect(() => {
        if(streamReady && streamRef.current) {
            
            connectionRef.current = new Peer({ 
                initiator: true, trickle: false, stream: streamRef.current 
            });
        
            connectionRef.current.on('signal', (data) => {
                // callerId should be user
                socket?.emit('call-user', {
                    callerId, receiverId, signal: data, 
                    type: 'audio', callerName, to: receiverId
                });
            });
            
            // should contain only "to" and "signal" in data
            socket?.on('call-accepted', (data: { to: string, signal: SignalData }) => {
                setCallAccepted(true);
                acceptedRef.current = true;
                connectionRef.current?.signal(data.signal);
            });

            connectionRef.current.on('stream', (curStream) => {
                if(userAudioRef.current) {
                    userAudioRef.current.srcObject = curStream;
                    userAudioRef.current?.play();
                }
            });

            setTimeout(() => {
                if(!acceptedRef.current) endCall();
            }, 90000);
        }
    }, [streamReady]);

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
                        <CallProfileImage userName={receiverName || ""} />
                        <h3 className="text-white">{receiverName}</h3>
                        {!callAccepted && <span className='txt-14 text-white'>Calling...</span>}
                        {callAccepted && <Timing callAccepted={callAccepted} setDuration={setDuration} />}
                    </div>
                    <audio ref={myAudioRef} hidden autoPlay />
                    <audio ref={userAudioRef} hidden autoPlay />
                </div>

                <div className={styles.Call__Footer}>
                    <div className={styles.call__Footer}>
                        <div className={`${styles.cancel} pointer`} onClick={() => endCall()}>
                            <FcEndCall className={`${styles.call_icon} ${styles.end_icon}`}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};


export default function AudioCallPage() {

    <Suspense fallback={<AudioCallLoading />}>
        <AudioCall />
    </Suspense>
};
