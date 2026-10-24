import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

type AudioPlayerProps = {
  src: string;
  title: string;
  onProgress?: (currentTime: number, duration: number) => void;
};

export function AudioPlayer({ src, title, onProgress }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onProgress?.(audio.currentTime, audio.duration || 0);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      onProgress?.(audio.currentTime, audio.duration || 0);
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onProgress, src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Audio</p>
          <h4 className="text-lg font-semibold text-white">{title}</h4>
        </div>
        <button type="button" onClick={togglePlay} className="rounded-full bg-[#fbbf24] p-3 text-[#111827]">
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
      </div>

      <audio ref={audioRef} src={src} controls className="w-full" />

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-300">
        <span>{new Date(currentTime * 1000).toISOString().slice(14, 19)}</span>
        <span>{new Date(duration * 1000).toISOString().slice(14, 19)}</span>
      </div>
    </div>
  );
}
