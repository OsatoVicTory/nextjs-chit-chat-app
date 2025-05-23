"use client";

import { useRef, useState, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function useWaveRecorder(
    audioRef: React.RefObject<HTMLAudioElement | null>, 
    canvasRef: React.RefObject<HTMLCanvasElement | null>, 
    waveRef: React.RefObject<HTMLDivElement | null>, 
    WIDTH: number, HEIGHT: number, CANVAS_WIDTH: number, CANVAS_HEIGHT: number, 
    COLOR: string, setAudioToSend: (str: Blob) => void
) {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [recordedAudio, setRecordedAudio] = useState<HTMLAudioElement | null>(null);
    const [wave, setWave] = useState<WaveSurfer | null>(null);
    const [recordingTime, setRecordingTime] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [playbackTime, setPlaybackTime] = useState<number>(0);
    const rec = useRef<MediaRecorder | null>(null);
    const animation = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const x = useRef<number>(30);
    const ctrl = useRef<string>("");
    const timeRef = useRef<NodeJS.Timeout | null>(null);
    const chunkBucket = useRef<Blob[]>([]);
    const amplitudeRef = useRef(new Array(26).fill(0));
    const ctx = useRef<CanvasRenderingContext2D | null>(null);
    const blobRef = useRef<Blob | null>(null);

    useEffect(() => { 
        if(!waveRef.current) return;
        const Wave = WaveSurfer.create({
            container: waveRef.current,
            waveColor: '#A5A4A4',
            progressColor: '#25d366',
            cursorColor: '#25d366',
            cursorWidth: 4,
            barWidth: 3,
            barGap: 2,
            height: 50,
        });
        setWave(Wave);
        timeRef.current = setInterval(() => {
            if(rec.current?.state === 'recording') {
                setRecordingTime((prev) => prev + 1);
                setTotalDuration((prev) => prev + 1);
            }
        }, 1000);

        Wave.on('finish', () => stopPlaying());

        return () => { 
            // cancelAnimationFrame(animation.current);
            if(animation.current) clearInterval(animation.current);
            sourceRef.current?.disconnect();
            audioContextRef.current?.close();
            if(rec.current?.state === 'recording') rec.current.stop();
            streamRef.current?.getTracks().forEach((track) => track.stop());
            Wave.destroy();
            wave?.destroy();
            // if(blobRef.current) URL.revokeObjectURL(blobRef.current);
            if(timeRef.current) clearInterval(timeRef.current);
        }; 
    }, []);

    useEffect(() => {
        if(wave) start();
    }, [wave]);

    useEffect(() => {
        const updateTime = () => setPlaybackTime(Math.floor(recordedAudio?.currentTime||0));
        if(recordedAudio) recordedAudio.addEventListener('timeupdate', updateTime);
        return () => recordedAudio?.removeEventListener('timeupdate', updateTime);
    }, [recordedAudio]);

    const stopPlaying = useCallback(() => {
        setIsPlaying(false);
        wave?.stop();
        // do nothing
    }, [wave]);

    const start = useCallback(() => {
        audioContextRef.current = new (window.AudioContext || window.AudioContext)();
        if(canvasRef?.current?.getContext) ctx.current = canvasRef.current.getContext('2d');
        setIsRecording(true);
        navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
            renderStream(stream);
            rec.current = new MediaRecorder(stream);
            if(audioRef.current) audioRef.current.srcObject = stream;
            rec.current.ondataavailable = (e: BlobEvent) => chunkBucket.current.push(e.data);
            rec.current.onpause = () => {
                // console.log('paused');
                const blob = new Blob(chunkBucket.current, { type: 'audio/ogg; codecs=opus' });
                const audioUrl = URL.createObjectURL(blob);
                blobRef.current = blob;
                const audio = new Audio(audioUrl);
                setRecordedAudio(audio);
                wave?.load(audioUrl);
            };
            rec.current.onstop = () => {
                // console.log('stopped');
                const blob = new Blob(chunkBucket.current, { type: 'audio/ogg; codecs=opus' });
                // const audioUrl = URL.createObjectURL(blob);
                // setAudioToSend(audioUrl);
                setAudioToSend(blob);
            };
            rec.current.start();
        }).catch(err => {
            setIsRecording(false);
            console.log(err)
        });
    }, [wave]);

    const renderStream = useCallback((stream: MediaStream) => {
        streamRef.current = stream;
        if(audioContextRef.current) {
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            const analyser = audioContextRef.current.createAnalyser();
            sourceRef.current.connect(analyser);
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.fftSize);

            const render = () => {
                if(ctrl.current === 'stop') return;
                analyser.getByteFrequencyData(dataArray);
                renderCanvas(dataArray, 0);
            }
            render();
            animation.current = setInterval(render, 100);
        }
    }, []);

    const renderCanvas = useCallback((dataArray: Uint8Array<ArrayBuffer>, dur: number) => {
        if(!ctx.current) return;
        const sum = dataArray.reduce((acc: number, val: number) => acc + val, 0);
        const pitch = sum / (dataArray.length||1);
        const barHeight = Number(Math.max(1, (HEIGHT * (pitch / 50))).toFixed(2));
        let T = 25;
        const arr = [];
        while(T) arr[T - 1] = amplitudeRef.current[T--];
        arr[25] = barHeight;
        ctx.current.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        T = 0;
        while(T < 26) {
            ctx.current.fillStyle = COLOR;
            ctx.current.fillRect(
                T * (WIDTH + 2), 
                Math.floor((HEIGHT - arr[T]) / 2), 
                WIDTH, arr[T]
            );
            T++;
        }
        
        amplitudeRef.current = arr;
    }, []);
    
    const haltRecording = useCallback(() => {
        if(rec.current?.state === 'recording') {
            rec.current.requestData();
            rec.current.pause();
            wave?.stop();
            ctrl.current = 'stop';
            setIsRecording(false);
        } 
    }, [wave]);

    const handlePlayRecording = useCallback(() => {
        if(recordedAudio) {
            wave?.play();
            recordedAudio.play();
            setIsPlaying(true);
        } 
    }, [wave, recordedAudio]);

    const handlePauseRecording = useCallback(() => {
        if(!rec.current) return;
        wave?.pause();
        recordedAudio?.pause();
        setIsPlaying(false);
    }, [wave, recordedAudio]);

    const resumeRecording = useCallback(() => {
        if(rec.current?.state !== 'recording') {
            if(!rec.current?.resume) return;
            setIsRecording(true);
            rec.current?.resume();
            ctrl.current = 'resume';
        }
    }, []);

    const stopRecordingAndSend = useCallback(() => {
        setIsRecording(false);
        rec.current?.stop();
    }, []);

    return {
        recordedAudio, isRecording, recordingTime, isPlaying,   
        playbackTime, haltRecording, resumeRecording, totalDuration, 
        handlePlayRecording, stopRecordingAndSend, handlePauseRecording
    };
};