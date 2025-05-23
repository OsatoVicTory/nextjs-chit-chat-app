"use client";

import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { IoMdMicOff, IoMdMic } from "react-icons/io";
import { FaVideo, FaVideoSlash } from 'react-icons/fa';
import Peer, { SignalData } from "simple-peer";
import { CallProfileImage, Timing } from '../../../util/callUtil';
import { AppContext } from '@/context/app';
import styles from "../call.module.css";
import { useRouter } from 'next/navigation';
import { FcEndCall } from 'react-icons/fc';
import { MessageType } from '@/components/types';
import { v4 as uuidv4 } from "uuid";


export default function VideoCall({ backPage } : { backPage: string | undefined }) {

    const router = useRouter();
    const { user, socket, calling, setCalling, chats, setChats } = useContext(AppContext);
    const { receiverId, receiverName } = calling || {};
    const callerId = user.socketId;
    const callerName = user.userName;
    const [callAccepted, setCallAccepted] = useState<boolean>(false);
    const myVideoRef = useRef<HTMLVideoElement | null>(null);
    const userVideoRef = useRef<HTMLVideoElement | null>(null);
    const connectionRef = useRef<Peer.Instance | null>(null);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
    const [userStreamData, setUserStreamData] = useState<{video: boolean, audio: boolean}>({ video: true, audio: true });
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
                call: `video`,
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
            const back = backPage || "/chat";
            router.push(back);
        }
    }, [callAccepted]);

    const endCall = useCallback((canRoute = true) => {
        socket?.emit('end-call', { callerId, receiverId, to: receiverId, ender: callerId }); 
        closePage(canRoute);      
    }, []);

    const muteCall = useCallback(() => {
        if(streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks();
            if(audioTracks.length > 0) {
                audioTracks[0].enabled = !isMuted;
                socket?.emit('stream-data', { audio: !isMuted, video: isVideoOn, to: receiverId });
                setIsMuted(!isMuted);
            }
        }
    }, [isMuted, isVideoOn]);

    const toggleVideo = useCallback(() => {
        if(streamRef.current) {
            const videoTracks = streamRef.current.getVideoTracks();
            if(videoTracks.length > 0) {
                videoTracks[0].enabled = !isVideoOn;
                socket?.emit('stream-data', { audio: isMuted, video: !isVideoOn, to: receiverId });
                setIsVideoOn(!isVideoOn);
            }
        }
    }, [isMuted, isVideoOn]);

    useEffect(() => {
        
        if(!calling) return closePage();

        navigator.mediaDevices.getUserMedia({video: true, audio: true}) // for audio video will be false
        .then(curStream => {
            streamRef.current = curStream;
            if(!streamReady) setStreamReady(true);
            if(myVideoRef.current) myVideoRef.current.srcObject = curStream;
        }).catch(err => {
            closePage();
        });

        socket?.on('user-in-call', (data: { to: string }) => {
            closePage();
        });

        socket?.on('stream-data', (data: { audio: boolean, video: boolean, receiverId: string }) => {
            setUserStreamData({ audio: data.audio, video: data.video });
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
                    type: 'video', callerName, to: receiverId
                });
            });
            
            // should contain only "to" and "signal" in data
            socket?.on('call-accepted', (data: { to: string, signal: SignalData }) => {
                setCallAccepted(true);
                acceptedRef.current = true;
                connectionRef.current?.signal(data.signal);
            });

            connectionRef.current.on('stream', (curStream) => {
                if(userVideoRef.current) userVideoRef.current.srcObject = curStream;
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
                if(myVideoRef.current) myVideoRef.current.srcObject = null;
                if(userVideoRef.current) userVideoRef.current.srcObject = null;
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
                <div className={`${styles.Call__main} video ${callAccepted}`}>
                    {/* {callAccepted && <div className={`${styles.userStream} video`}>
                        <div className={`${styles.stream_mic} ${userStreamData.audio}`}>
                            {!userStreamData.audio ? 
                                <IoMdMicOff className={styles.call_icon}/> :
                                <IoMdMic className={styles.call_icon}/>
                            }
                        </div>
                        <div className={`${styles.stream_vid} ${styles[`stream_vid_${userStreamData.video}`]}`}>
                            {!userStreamData.video ? 
                                <FaVideoSlash className={styles.call_icon}/> :
                                <FaVideo className={styles.call_icon}/>
                            }
                        </div>
                    </div>} */}
                    <div className={styles.call_top}>
                        {!callAccepted && <CallProfileImage userName={receiverName || ""} />}
                        <h3 className="text-white">{receiverName}</h3>
                        {!callAccepted && <span className='txt-14 text-white'>Calling...</span>}
                        {callAccepted && <Timing callAccepted={callAccepted} setDuration={setDuration} />}
                    </div>
                    <video playsInline ref={myVideoRef} autoPlay className={styles.myVideo} />
                    <div className={`${styles.placeholder_image} ${(!callAccepted||!userStreamData.video)&&(styles.placeholder_image_show)}`}></div>
                    <video playsInline ref={userVideoRef} autoPlay className={styles.receiverVideo} />
                </div>

                {!callAccepted && <div className={styles.Call__Footer}>
                    <div className={styles.call__Footer}>
                        <div className={`${styles.cancel} ${styles.cancel_first} pointer`} onClick={() => endCall()}>
                            <FcEndCall className={`${styles.call_icon} ${styles.end_icon}`}/>
                        </div>
                    </div>
                </div>}

                {callAccepted && <div className={styles.Call__Footer}>
                    <div className={styles.call__Footer}>
                        <div className={`${styles.mute} pointer`} onClick={muteCall}>
                            {isMuted ? 
                                <IoMdMicOff className={styles.call_icon}/> :
                                <IoMdMic className={styles.call_icon}/>
                            }
                        </div>
                        <div className={`${styles.video_button} pointer`} onClick={toggleVideo}>
                            {isVideoOn ? 
                                <FaVideoSlash className={styles.call_icon}/> :
                                <FaVideo className={styles.call_icon}/>
                            }
                        </div>
                        <div className={`${styles.cancel} pointer`} onClick={() => endCall()}>
                            <FcEndCall className={`${styles.call_icon} ${styles.end_icon}`}/>
                        </div>
                    </div>
                </div>}
            </div>
        </div>
    )
};