"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from "./waveCapture.module.css";
import { MdSend, MdDelete } from 'react-icons/md';
import { AiOutlinePause } from 'react-icons/ai';
import { BsPause, BsFillMicFill, BsPlayFill } from 'react-icons/bs';
import useWaveRecorder from '@/hooks/_waveEditor';

export default function WaveCapture(
    { close, sendVN } : 
    { close: () => void, sendVN: (str: Blob, audioDuration: number) => void }
) {

    const [audioUrl, setAudioUrl] = useState<Blob | null>(null);
    const waveRef = useRef<HTMLDivElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const width = 130;
    const height = 50;

    const formatTime = useCallback((time: number) => {
        const zeros = (val: number) => val >= 10 ? val : '0'+val;
        const min = Math.floor(time / 60);
        const sec = time % 60;
        return `${zeros(min)}:${zeros(sec)}`;
    }, []);

    const {
        isRecording, recordingTime, isPlaying, 
        playbackTime, totalDuration, haltRecording, resumeRecording, 
        stopRecordingAndSend, handlePauseRecording, handlePlayRecording, 
    } = useWaveRecorder(audioRef, canvasRef, waveRef, 3, 50, width, height, '#A5A4A4', setAudioUrl);

    const send = useCallback(() => {
        stopRecordingAndSend();
    }, []);

    useEffect(() => {
        if(audioUrl) sendVN(audioUrl, totalDuration);
    }, [audioUrl, totalDuration]);

    return (
        <div className={styles.waveform__Capture}>
            <div className={styles.waveform__Capture__Wrapper}>

                <div className={styles.wave__form}>
                    <div className={`${styles.wave__form__} ${styles.recorder} ${isRecording&&styles.isRecording}`}>
                        <canvas ref={canvasRef} height={`${height}`} width={`${width}`} />
                    </div>
                    <div className={`${styles.wave__form__} ${styles.player} ${!isRecording&&styles.isRecording}`}>
                        <div className={styles.wave__form__player__} ref={waveRef} />
                    </div>
                    <div className={`${styles.wave__form__text} fnt-400 grey`}>
                        {formatTime(!isRecording ? playbackTime : recordingTime)}
                    </div>
                </div>

                <div className={styles.waveform__Send} onClick={send}>
                    <MdSend className={styles.wf_icons} /> 
                </div>

                <audio ref={audioRef} hidden />
            </div>

            <div className={styles.mic_base}>
                <MdDelete className={styles.wf_icons} onClick={() => close()} />

                {isRecording ? 
                    <BsPause className={`${styles.wf_icons} red`}
                    onClick={() => haltRecording()} /> :
                    <BsFillMicFill className={`${styles.wf_icons} red`}
                    onClick={() => resumeRecording()} />
                }

                {!isRecording && <div className={styles.wave_form_playpause}>
                    {isPlaying ?
                        <AiOutlinePause className={styles.wf_icons} 
                        onClick={() => handlePauseRecording()}/> :
                        <BsPlayFill className={styles.wf_icons} 
                        onClick={() => handlePlayRecording()} />
                    }
                </div>}
            </div>

        </div>
    )
};