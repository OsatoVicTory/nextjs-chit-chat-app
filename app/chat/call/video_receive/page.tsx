"use client";

import React, { useState, useEffect, useRef, useCallback, useContext, Suspense } from "react";
import { IoMdCall, IoMdMicOff, IoMdMic } from "react-icons/io";
import { FaVideo, FaVideoSlash } from 'react-icons/fa';
import Peer from "simple-peer";
import { Timing, CallProfileImage } from "../../../util/callUtil";
import { AppContext } from "@/context/app";
import styles from "../call.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { FcEndCall } from "react-icons/fc";
import Skeleton from '@/components/chatList/skeleton';


function VideoCallLoading() {

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

function VideoReceive() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, socket, ringing, setRinging } = useContext(AppContext);
    const { callerId, callerName, signal } = ringing || {};
    const receiverId = user.socketId;
    const [callAccepted, setCallAccepted] = useState<boolean>(false);
    const myVideoRef = useRef<HTMLVideoElement | null>(null);
    const userVideoRef = useRef<HTMLVideoElement | null>(null);
    const connectionRef = useRef<Peer.Instance | null>(null);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
    const [userStreamData, setUserStreamData] = useState({ video: true, audio: true });
    const streamRef = useRef<MediaStream | null>(null);
    const callAcceptedRef = useRef<boolean>(false);
    const callDuration = useRef<number>(0);

    const closePage = useCallback((canRoute = true) => {
        setRinging(null);
        if(canRoute) {
            const back = searchParams.get("back") || "/chat";
            router.push(back);
        }
    }, []);

    const endCall = useCallback((canRoute = true) => {
        if(socket) socket.emit('end-call', { callerId, receiverId, to: callerId, ender: receiverId }); 
        closePage(canRoute);
    }, [socket]);

    const muteCall = useCallback(() => {
        if(streamRef.current && socket) {
            const audioTracks = streamRef.current.getAudioTracks();
            if(audioTracks.length > 0) {
                audioTracks[0].enabled = !isMuted;
                socket.emit('stream-data', { audio: !isMuted, video: isVideoOn, to: callerId });
                setIsMuted(!isMuted);
            }
        }
    }, [isMuted, isVideoOn, socket]);

    const toggleVideo = useCallback(() => {
        if(streamRef.current && socket) {
            const videoTracks = streamRef.current.getVideoTracks();
            if(videoTracks.length > 0) {
                videoTracks[0].enabled = !isVideoOn;
                socket.emit('stream-data', { audio: isMuted, video: !isVideoOn, to: callerId });
                setIsVideoOn(!isVideoOn);
            }
        }
    }, [isMuted, isVideoOn, socket]);
        
    const answerCall = useCallback(() => {

        if(!streamRef.current || !signal) return;

        connectionRef.current = new Peer({ 
            initiator: false, trickle: false, stream: streamRef.current 
        });
        
        connectionRef.current.on('signal', (data) => {
            socket?.emit('call-accepted', { 
                callerId, receiverId, signal: data, type: 'video',
                to: callerId, receiverName: user.userName,
            });
        });
        
        connectionRef.current.signal(signal);
        callAcceptedRef.current = true;
        setCallAccepted(true);

        //caller stream
        connectionRef.current.on('stream', (curStream) => {
            if(userVideoRef.current) userVideoRef.current.srcObject = curStream;
        });
    }, [signal]);

    useEffect(() => {
        
        // console.log("ringing", ringing, ringing && "ringing good !");
        if(!ringing) return closePage();

        // only close since in caller side we would have 
        // made call to update in db after 60 secs
        setTimeout(() => {
            if(!callAcceptedRef.current) closePage();
        }, 60000);

        navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then(curStream => {
                streamRef.current = curStream;
                if(myVideoRef.current) myVideoRef.current.srcObject = curStream;
                // answerCall();
            }).catch(err => {
                // console.log("video receive stream error", err);
                closePage();
            });

        socket?.on('ended-call', (data) => {
            closePage();
        });

        socket?.on('stream-data', (data: { audio: boolean, video: boolean, receiverId: string }) => {
            setUserStreamData({ audio: data.audio, video: data.video });
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
                                <IoMdMicOff className={styles.call_icon} /> :
                                <IoMdMic className={styles.call_icon} />
                            }
                        </div>
                        <div className={`${styles.stream_vid} ${userStreamData.video}`}>
                            {!userStreamData.video ? 
                                <FaVideoSlash className={styles.call_icon} /> :
                                <FaVideo className={styles.call_icon} />
                            }
                        </div>
                    </div>} */}

                    <div className={styles.call_top}>
                        {!callAccepted && <CallProfileImage userName={callerName||""} />}
                        <h3 className="text-white">{callerName}</h3>
                        {!callAccepted && <span className='txt-14 text-white'>Incoming...</span>}
                        {callAccepted && <Timing callAccepted={callAccepted} setDuration={setDuration} />}
                    </div>
                    <video playsInline ref={myVideoRef} autoPlay className={styles.myVideo} />
                    <div className={`${styles.placeholder_image} ${(!callAccepted||!userStreamData.video)&&(styles.placeholder_image_show)}`}></div>
                    <video playsInline ref={userVideoRef} autoPlay className={styles.receiverVideo} />
                </div>
                
                {callAccepted && <div className={styles.Call__Footer}>
                    <div className={styles.call__Footer}>
                        <div className={`${styles.mute} pointer`} onClick={muteCall}>
                            {isMuted ? 
                                <IoMdMicOff className={styles.call_icon} /> :
                                <IoMdMic className={styles.call_icon} />
                            }
                        </div>
                        <div className={`${styles.video_button} pointer`} onClick={toggleVideo}>
                            {isVideoOn ? 
                                <FaVideoSlash className={styles.call_icon} /> :
                                <FaVideo className={styles.call_icon} />
                            }
                        </div>
                        <div className={`${styles.cancel} pointer`} onClick={() => endCall()}>
                            <FcEndCall className={`${styles.call_icon} ${styles.end_icon}`}/>
                        </div>
                    </div>
                </div>}

                {!callAccepted && <div className={`${styles.Call__Footer} ${styles.center}`}>
                    <div className={styles.call__Footer}>
                        <div className={`${styles.answer} pointer`} onClick={answerCall}>
                            <IoMdCall className={styles.call_icon} />
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


export default function VideoReceivePage() {

    <Suspense fallback={<VideoCallLoading />}>
        <VideoReceive />
    </Suspense>
};