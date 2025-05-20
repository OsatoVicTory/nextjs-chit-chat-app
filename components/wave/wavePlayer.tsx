"use client";

import { useState, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import styles from "./wavePlayer.module.css";
import { FaPlay } from 'react-icons/fa';
import { AiOutlinePause } from 'react-icons/ai';
import Skeleton from '../chatList/skeleton';

export default function WavePlayer({ 
    waveColor, progressColor, audio, waveHeight, userImg, _id, state, setState, setPlayingTime, 
}: { 
    waveColor: string, progressColor: string, audio: Blob | undefined, waveHeight: number, userImg: string, _id: string, 
    state: string, setState: (s: string) => void, setPlayingTime: (s: number) => void, 
}) {

    const [waveIsDrawn, setWaveIsDrawn] = useState(false);
    const [wave, setWave] = useState<WaveSurfer | null>(null);

    useEffect(() => { 
        const Wave = WaveSurfer.create({
            container: `#waveform-${_id}`,
            waveColor,
            progressColor,
            cursorColor: progressColor,
            cursorWidth: 4,
            barWidth: 3,
            barGap: 2,
            height: waveHeight||33,
            // responsive: true,
        });
        setWave(Wave);

        // Wave.on('finish', () => stopPlaying());

        return () => { 
            Wave?.destroy(); 
            wave?.destroy(); 
        }

    }, []);

    useEffect(() => {
        let audioUrl = "";
        if(wave && audio) {
            const blob = new Blob([audio], { type: 'audio/ogg; codecs=opus' });
            audioUrl = URL.createObjectURL(blob);
            wave.load(audioUrl);
            wave.on('timeupdate', (currentTime) => setPlayingTime(currentTime));
            wave.on('redraw', () => {
                if(!waveIsDrawn) setWaveIsDrawn(true);
            });
            // wave.on('ready', (durationTime) => {
            //     if(!waveIsReady) setWaveIsReady(true);
            // });
            wave.on('finish', () => setState('stopped'));
        }
        return () => {
            if(audioUrl) URL.revokeObjectURL(audioUrl);
        }
    }, [wave, audio]);

    const togglePlayPause = useCallback(() => {
        if(wave) {
            wave.playPause();
            if(state === 'playing') {
                // audioRef.current.pause();
                setState('paused');
            } else {
                // audioRef.current.play();
                setState('playing');
            }
        }
    }, [wave, state]);

    return (
        <div className={styles.wavePlayer}>
            <div className={styles.wP__playpause} onClick={togglePlayPause}>
                {state === 'playing' ? 
                <AiOutlinePause className={styles.wP__icon} /> : 
                <FaPlay className={styles.wP__icon} />}
            </div>
            <div className={styles.wP__waveform__}>
                <div className={styles._waveform_} id={`waveform-${_id}`}></div>
                {!waveIsDrawn && <div className={styles._waveform_loader_}>
                    <Skeleton />
                </div>}
                {/* <div className={styles._waveform_time}>
                    {formatTime(state === 'stopped' ? audioDuration : playingTime)}
                </div> */}
            </div>
            <div className={styles.wP__img}>
                {/* userImg = OV for Osato Victory, already sorted from parent */}
                {userImg} 
            </div>
        </div>
    )
};