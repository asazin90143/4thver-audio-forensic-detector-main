"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState, useRef } from "react";
import { Mic, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AudioAnalysis from "./components/audio-analysis";
import SonarView from "./components/sonar-view";
import AudioSettings from "./components/audio-settings";
import LiveVisualization from "./components/live-visualization";

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

  // Cleanup timer when unmounting
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
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
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const playAudio = () => {
    if (!audioData) return;
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
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audio Forensic Detector</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isRecording ? (
            <Button onClick={startRecording}>
              <Mic className="mr-2 h-4 w-4" /> Start Recording
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopRecording}>
              <Mic className="mr-2 h-4 w-4" /> Stop Recording
            </Button>
          )}

          <p>Recording Time: {recordingTime}s</p>

          {audioData && (
            <div className="space-x-2">
              <Button onClick={playAudio} disabled={isPlaying}>
                ▶ Play Recording
              </Button>
              <Button onClick={analyzeAudio} disabled={isAnalyzing}>
                🔍 Analyze Audio
              </Button>
            </div>
          )}

          {isAnalyzing && (
            <Progress value={analysisProgress} className="w-full" />
          )}

          {/* Keep your original visual components */}
          <LiveVisualization />
          <AudioAnalysis />
          <SonarView />
          <AudioSettings />
        </CardContent>
      </Card>
    </div>
  );
}
