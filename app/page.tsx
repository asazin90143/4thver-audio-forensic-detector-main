"use client";

import React, { useEffect, useState, useRef } from "react";

interface AudioData {
  url: string;
  blob: Blob;
}

export default function HomePage() {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Recording setup
  useEffect(() => {
    if (typeof window === "undefined") return;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (typeof window === "undefined") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioData({ url, blob });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (typeof window === "undefined") return;

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const playAudio = () => {
    if (typeof window === "undefined" || !audioData) return;

    const audio = new Audio(audioData.url);
    audioRef.current = audio;
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.play();
  };

  const analyzeAudio = async () => {
    if (!audioData) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Fake progress bar for demonstration
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((res) => setTimeout(res, 200));
      setAnalysisProgress(i);
    }

    setIsAnalyzing(false);
    alert("Audio analysis complete!");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Audio Forensic Detector</h1>

      {!isRecording ? (
        <button onClick={startRecording}>🎤 Start Recording</button>
      ) : (
        <button onClick={stopRecording}>⏹ Stop Recording</button>
      )}

      <p>Recording Time: {recordingTime}s</p>

      {audioData && (
        <div>
          <button onClick={playAudio} disabled={isPlaying}>
            ▶ Play Recording
          </button>
          <button onClick={analyzeAudio} disabled={isAnalyzing}>
            🔍 Analyze Audio
          </button>
        </div>
      )}

      {isAnalyzing && <p>Analysis Progress: {analysisProgress}%</p>}
    </div>
  );
}
