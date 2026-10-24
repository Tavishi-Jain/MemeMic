import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Square, TimerReset } from "lucide-react";

export type RecordingResult = {
  blob: Blob;
  url: string;
};

type AudioRecorderProps = {
  onRecordingComplete: (result: RecordingResult) => void;
  onError: (message: string) => void;
};

export function AudioRecorder({ onRecordingComplete, onError }: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, [previewUrl]);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = window.setInterval(() => {
      setDuration((value) => value + 1);
    }, 1000);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onError("This browser does not support microphone recording. Try Chrome, Edge, or Safari.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;
      const data = new Uint8Array(analyser.fftSize);

      const updateMeter = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / data.length;
        setAudioLevel(average / 255);
        if (isRecording) {
          animationFrameRef.current = requestAnimationFrame(updateMeter);
        }
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopTimer();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (audioContextRef.current) {
          void audioContextRef.current.close();
          audioContextRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) {
          onError("The recording is empty. Try again with a clearer story.");
          return;
        }

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onRecordingComplete({ blob, url });
        setIsRecording(false);
        setIsPaused(false);
      };

      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      startTimer();
      updateMeter();
    } catch (error) {
      onError((error as Error).message || "Microphone access was blocked. Please allow mic permission and retry.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    } else if (mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const reset = () => {
    stopTimer();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setDuration(0);
    setAudioLevel(0);
    setIsPaused(false);
    setIsRecording(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.35)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-400">Recording</p>
          <h3 className="text-2xl font-semibold text-white">
            {isRecording ? (isPaused ? "Paused" : "Live") : "Ready"}
          </h3>
        </div>
        <div className="rounded-full border border-[#fbbf24]/50 bg-[#fbbf24]/10 px-3 py-1 text-sm font-semibold text-[#fcd34d]">
          {duration}s
        </div>
      </div>

      <div className="mb-6 flex items-center justify-center">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex h-28 w-28 items-center justify-center rounded-full border text-3xl shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-all ${
            isRecording
              ? "border-red-500 bg-red-500/20 text-red-300"
              : "border-[#fbbf24] bg-[#fbbf24] text-[#111827] hover:scale-[1.02]"
          }`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </button>
      </div>

      <div className="mb-6 flex h-14 items-end gap-2 overflow-hidden rounded-full bg-zinc-900/80 p-2">
        {Array.from({ length: 18 }).map((_, index) => {
          const level = Math.max(18, Math.min(100, ((Math.sin(index + audioLevel * 30) + 1) / 2) * 100));
          return (
            <span
              key={index}
              className="w-full rounded-full bg-gradient-to-t from-[#fbbf24] via-[#fca5a5] to-[#f8fafc]"
              style={{ height: `${level}%`, opacity: 0.22 + index * 0.04 }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={togglePause}
          disabled={!isRecording}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pause className="h-4 w-4" />
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 font-medium text-white"
        >
          <TimerReset className="h-4 w-4" />
          Reset
        </button>
      </div>

      {previewUrl ? (
        <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3">
          <audio controls src={previewUrl} className="w-full" />
        </div>
      ) : null}
    </div>
  );
}
