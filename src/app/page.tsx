"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AudioLines,
  Copy,
  Download,
  FileDown,
  Library,
  Mic,
  PenLine,
  Play,
  RefreshCw,
  Save,
  Share2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { CharacterCard } from "@/components/characters/CharacterCard";
import { CaptionOverlay } from "@/components/captions/CaptionOverlay";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { AudioRecorder, type RecordingResult } from "@/components/recorder/AudioRecorder";
import { characters, defaultCharacterId, getCharacterById } from "@/config/characters";
import { getDemoTranscript } from "@/lib/story-engine";
import {
  MAX_SAVED_PERFORMANCES,
  SAVED_PERFORMANCES_KEY,
  parseSavedPerformances,
  type SavedPerformance,
} from "@/lib/saved-performances";
import { decodeSharedPerformance, encodeSharedPerformance, type SharedPerformance } from "@/lib/share-link";
import {
  validateCharacterId,
  validateScript,
  validateStory,
  type HumorIntensity,
  type ScriptLanguage,
} from "@/lib/validation";

type View = "home" | "recording" | "transcript" | "character" | "script" | "performance" | "library" | "shared";

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [storyInput, setStoryInput] = useState("");
  const [transcript, setTranscript] = useState(getDemoTranscript());
  const [selectedCharacterId, setSelectedCharacterId] = useState(defaultCharacterId);
  const [script, setScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [playback, setPlayback] = useState({ currentTime: 0, duration: 0 });
  const [isBusy, setIsBusy] = useState(false);
  const [savedPerformances, setSavedPerformances] = useState<SavedPerformance[]>([]);
  const [sharedPerformance, setSharedPerformance] = useState<SharedPerformance | null>(null);
  const [humorIntensity, setHumorIntensity] = useState<HumorIntensity>("medium");
  const [language, setLanguage] = useState<ScriptLanguage>("hinglish");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [recordTogether, setRecordTogether] = useState(false);

  const currentCharacter = useMemo(
    () => getCharacterById(selectedCharacterId) ?? getCharacterById(defaultCharacterId),
    [selectedCharacterId],
  );

  useEffect(
    () => () => {
      if (audioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(audioUrl);
      }
    },
    [audioUrl],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setSavedPerformances(parseSavedPerformances(window.localStorage.getItem(SAVED_PERFORMANCES_KEY)));
        const lastPerformance = window.localStorage.getItem("mememic-last-performance");
        if (lastPerformance) {
          const parsed: unknown = JSON.parse(lastPerformance);
          if (parsed && typeof parsed === "object") {
            const previous = parsed as { characterId?: unknown; script?: unknown };
            if (typeof previous.characterId === "string" && getCharacterById(previous.characterId)) {
              setSelectedCharacterId(previous.characterId);
            }
            if (typeof previous.script === "string" && previous.script.length <= 5000) {
              setScript(previous.script);
            }
          }
        }
      } catch {
        setError("Saved performances are unavailable because browser storage is disabled.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const prefix = "#performance=";
      if (!window.location.hash.startsWith(prefix)) return;

      const shared = decodeSharedPerformance(window.location.hash.slice(prefix.length));
      if (!shared) {
        setError("This shared performance link is invalid or damaged.");
        return;
      }

      setSharedPerformance(shared);
      setSelectedCharacterId(shared.characterId);
      setView("shared");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const updatePlayback = useCallback((currentTime: number, duration: number) => {
    setPlayback({ currentTime, duration });
  }, []);

  const submitStory = () => {
    try {
      const cleaned = validateStory(storyInput || transcript);
      setTranscript(cleaned);
      setView("character");
      setError("");
      setMessage("Your story is ready. Pick the personality that should narrate it.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Please add a valid story.");
    }
  };

  const handleRecordingComplete = async (result: RecordingResult) => {
    setAudioUrl("");
    const textDraft = getDemoTranscript(storyInput);
    setStoryInput(textDraft);
    setTranscript(textDraft);
    setView("transcript");

    try {
      const formData = new FormData();
      formData.append("audio", result.blob, "story.webm");
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Audio transcription failed.");
      }

      setTranscript(data.transcript || textDraft);
      setMessage(data.message || "Recording captured. Review the transcript and fix any awkward phrasing.");
      setError("");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "We could not transcribe the recording yet.");
      setMessage("The recording was saved; you can review and correct the transcript manually.");
    }
  };

  const generateScript = async (remixInstruction?: string) => {
    try {
      setIsBusy(true);
      setError("");
      const cleanStory = validateStory(transcript);
      const cleanCharacter = validateCharacterId(selectedCharacterId);
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: cleanStory,
          characterId: cleanCharacter,
          remixInstruction,
          humorIntensity,
          language,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not generate the script.");
      }

      if (typeof data.script !== "string" || !data.script.trim()) {
        throw new Error("The script provider returned an empty response. Please try again.");
      }

      setScript(data.script);
      setMessage(data.message || "Comedy script is ready for a final polish.");
      setView("script");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "The script could not be generated.");
    } finally {
      setIsBusy(false);
    }
  };

  const generateVoice = async () => {
    try {
      setIsBusy(true);
      setError("");
      const cleanScript = validateScript(script || transcript);
      const response = await fetch("/api/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanScript,
          characterId: selectedCharacterId,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Voice generation failed.");
      }

      const audioBlob = await response.blob();
      if (!audioBlob.type.startsWith("audio/") || audioBlob.size === 0) {
        throw new Error("Fish Audio returned an invalid audio file. Please try again.");
      }

      const nextAudioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(nextAudioUrl);
      setPlayback({ currentTime: 0, duration: 0 });
      setMessage("Your performance was generated with Fish Audio. Hit play to listen.");
      setView("performance");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "The voice generation failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(script || transcript);
      setMessage("Script copied to your clipboard.");
    } catch {
      setError("Copy is unavailable in this browser. You can still paste the text manually.");
    }
  };

  const handleDownload = () => {
    if (!audioUrl) {
      setError("Generate the voice first to create a downloadable audio file.");
      return;
    }

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "mememic-performance.mp3";
    link.click();
    setMessage("Audio download started.");
  };

  const handleShare = async () => {
    const shareText = script || transcript;
    const shareUrl = `${window.location.origin}${window.location.pathname}#performance=${encodeSharedPerformance({
      script: shareText,
      characterId: selectedCharacterId,
    })}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MemeMic script by ${currentCharacter?.name ?? "MemeMic"}`,
          text: "Open this shared MemeMic script.",
          url: shareUrl,
        });
        setMessage("Shareable script link shared. It contains the script text, but not the audio.");
        return;
      } catch {
        // fallback to clipboard below
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Shareable script link copied. It contains the script text, but not the audio.");
    } catch {
      setError("Sharing is not supported on this device/browser.");
    }
  };

  const saveLocally = () => {
    try {
      const cleanScript = validateScript(script || transcript);
      const saved: SavedPerformance = {
        id: crypto.randomUUID(),
        script: cleanScript,
        characterId: selectedCharacterId,
        savedAt: new Date().toISOString(),
      };
      const next = [saved, ...savedPerformances].slice(0, MAX_SAVED_PERFORMANCES);
      window.localStorage.setItem(SAVED_PERFORMANCES_KEY, JSON.stringify(next));
      setSavedPerformances(next);
      setError("");
      try {
        window.localStorage.setItem(
          "mememic-last-performance",
          JSON.stringify({ script: cleanScript, characterId: selectedCharacterId }),
        );
      } catch {
        setError("Performance saved in the library, but the last-draft shortcut could not be updated.");
        return;
      }
      setMessage("Saved in this browser. Audio files are not stored in the library.");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "This performance could not be saved in browser storage.");
    }
  };

  const deleteSavedPerformance = (id: string) => {
    const next = savedPerformances.filter((performance) => performance.id !== id);
    try {
      window.localStorage.setItem(SAVED_PERFORMANCES_KEY, JSON.stringify(next));
      setSavedPerformances(next);
      setError("");
      setMessage("Saved performance deleted from this browser.");
    } catch {
      setError("Could not update browser storage. Please check available storage and try again.");
    }
  };

  const exportSavedPerformances = () => {
    const file = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), performances: savedPerformances }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mememic-saved-performances.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Saved scripts exported as a JSON file.");
  };

  const clearLocalData = () => {
    if (!window.confirm("Delete all saved performances and this browser's last draft? This cannot be undone.")) return;

    try {
      window.localStorage.removeItem(SAVED_PERFORMANCES_KEY);
      window.localStorage.removeItem("mememic-last-performance");
      setSavedPerformances([]);
      setScript("");
      setTranscript("");
      setStoryInput("");
      setAudioUrl("");
      setMessage("All MemeMic drafts and saved performances were removed from this browser.");
    } catch {
      setError("Could not clear browser storage. Please try again.");
    }
  };

  const loadSavedPerformance = (performance: SavedPerformance) => {
    setScript(performance.script);
    setSelectedCharacterId(performance.characterId);
    setAudioUrl("");
    setView("script");
    setMessage("Saved script loaded. Generate a new voice track when you are ready.");
  };

  const useSharedPerformance = () => {
    if (!sharedPerformance) return;
    setScript(sharedPerformance.script);
    setSelectedCharacterId(sharedPerformance.characterId);
    setView("script");
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setSharedPerformance(null);
    setMessage("Shared script loaded. Generate a new voice track when you are ready.");
  };

  const renderHome = () => (
    <div className="space-y-12 pb-10">
      <section className="relative isolate overflow-hidden rounded-[36px] border border-white/10 bg-[#0b1020] shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-20 -top-36 h-96 w-96 rounded-full bg-[#f97316]/20 blur-[100px]" />
          <div className="absolute -bottom-48 right-1/4 h-96 w-96 rounded-full bg-[#7c3aed]/20 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>

        <div className="grid min-h-[580px] items-center gap-4 px-6 py-8 md:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-14 lg:py-12">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#fbbf24]/30 bg-[#fbbf24]/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#fde68a]">
              <Sparkles className="h-4 w-4" />
              Your life. Now in the comedy section.
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Life gave you a story.
              <span className="mt-2 block bg-gradient-to-r from-[#fbbf24] via-[#fb923c] to-[#f472b6] bg-clip-text pb-2 text-transparent">
                Give it a punchline.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
              The missed bus. The awkward text. That family function that went completely off-script.
              Turn your real-life chaos into an original comedy script—and hear it performed.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setView("recording")}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fbbf24] px-6 py-3.5 font-bold text-[#111827] shadow-[0_14px_38px_rgba(251,191,36,0.25)] transition hover:-translate-y-0.5 hover:bg-[#fcd34d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbbf24]"
              >
                <Mic className="h-4 w-4" />
                Tell it out loud
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("transcript");
                  setTranscript(storyInput || "");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3.5 font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <PenLine className="h-4 w-4" />
                I’ll type it
              </button>
            </div>
            <p className="mt-5 text-xs text-zinc-500">Your story, your edits, your final say.</p>
          </div>

          <div className="relative mx-auto mt-5 flex w-full max-w-[440px] items-center justify-center lg:mt-0">
            <div aria-hidden="true" className="absolute h-[300px] w-[300px] rounded-full border border-dashed border-white/15 sm:h-[370px] sm:w-[370px]" />
            <div aria-hidden="true" className="absolute h-[250px] w-[250px] rounded-full bg-gradient-to-br from-[#fbbf24]/20 via-[#f97316]/10 to-[#7c3aed]/20 blur-2xl sm:h-[320px] sm:w-[320px]" />
            <div className="relative w-[min(78%,320px)] rotate-2 rounded-[30px] border border-white/15 bg-gradient-to-br from-[#fbbf24] via-[#f97316] to-[#7c3aed] p-1 shadow-[0_35px_90px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:rotate-0">
              <div className="overflow-hidden rounded-[27px] bg-[#111827]">
                {currentCharacter ? (
                  <Image
                    src={currentCharacter.art}
                    alt={`${currentCharacter.name}, the selected MemeMic narrator`}
                    width={640}
                    height={640}
                    priority
                    className="aspect-square w-full object-cover"
                  />
                ) : null}
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Your narrator</p>
                    <p className="mt-0.5 font-bold text-white">{currentCharacter?.name}</p>
                  </div>
                  <span className="rounded-full border border-[#fbbf24]/30 bg-[#fbbf24]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#fde68a]">
                    {currentCharacter?.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-[12%] rotate-6 rounded-2xl border border-white/15 bg-[#fff7d6] px-4 py-3 text-[#171717] shadow-xl sm:-right-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9a3412]">Plot twist!</p>
              <p className="mt-1 text-lg font-black">That&apos;s your bit.</p>
            </div>
            <div className="absolute bottom-[8%] left-0 -rotate-3 rounded-2xl border border-white/10 bg-[#111827]/90 px-4 py-3 shadow-xl backdrop-blur sm:-left-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fbbf24] text-[#111827]">
                  <AudioLines className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Original script</p>
                  <p className="text-sm font-bold text-white">Then, the punchline.</p>
                </div>
              </div>
              <div aria-hidden="true" className="mt-3 flex h-5 items-center gap-1">
                {[12, 20, 10, 17, 8, 19, 13, 6, 16, 10, 20, 8, 14, 5].map((height, index) => (
                  <span key={index} className="w-1 rounded-full bg-gradient-to-t from-[#f97316] to-[#fbbf24]" style={{ height }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid border-t border-white/10 bg-black/20 sm:grid-cols-3">
          {[
            ["01", "Drop the story", "Record it or type it."],
            ["02", "Pick the energy", "Choose your comic narrator."],
            ["03", "Press play", "Edit the script, then hear it."],
          ].map(([number, title, description], index) => (
            <div
              key={number}
              className={`flex items-start gap-3 px-6 py-5 md:px-8 ${index > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0" : ""}`}
            >
              <span className="text-xs font-black tracking-widest text-[#fbbf24]">{number}</span>
              <div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="mt-1 text-xs text-zinc-400">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#fbbf24]">Choose your comic energy</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Who&apos;s telling your story?</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300">6 fictional performers</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              selected={selectedCharacterId === character.id}
              onSelect={(id) => {
                setSelectedCharacterId(id);
                setMessage(`${getCharacterById(id)?.name} is selected for the next performance.`);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );

  const renderRecording = () => (
    <div className="space-y-6 pb-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111827] p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">Mic mode</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Tell your story out loud</h2>
          </div>
          <label className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              checked={recordTogether}
              onChange={(event) => setRecordTogether(event.target.checked)}
              className="mr-2 accent-[#fbbf24]"
            />
            Record with friends
          </label>
        </div>

        <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
          Your recording is sent to Groq for transcription. Avoid recording passwords, financial details, or other sensitive information.
        </p>

        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          onError={(messageText) => setError(messageText)}
        />
      </div>
    </div>
  );

  const renderTranscript = () => (
    <div className="space-y-6 pb-8">
      <div className="rounded-[32px] border border-white/10 bg-[#0f172a] p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">Transcript</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Review and refine your story</h2>
          </div>
          <button type="button" onClick={() => setView("recording")} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">
            Retake recording
          </button>
        </div>

        <textarea
          aria-label="Your story"
          value={transcript}
          maxLength={2200}
          onChange={(event) => setTranscript(event.target.value)}
          rows={12}
          className="min-h-[220px] w-full rounded-[24px] border border-white/10 bg-black/20 p-4 text-base text-white outline-none ring-0 placeholder:text-zinc-500"
          placeholder="Tell the funny incident in your own words..."
        />
        <p className="mt-2 text-right text-xs text-zinc-400">{transcript.length}/2200 characters</p>
        <p className="mt-2 text-sm text-zinc-400">
          When you generate a script, this story is sent to Groq. Avoid including sensitive personal details.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={submitStory}
            className="inline-flex items-center gap-2 rounded-full bg-[#fbbf24] px-5 py-3 font-semibold text-[#111827]"
          >
            <AudioLines className="h-4 w-4" />
            Continue to character selection
          </button>
          <button
            type="button"
            onClick={() => setView("recording")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Retry transcription
          </button>
        </div>
      </div>
    </div>
  );

  const renderCharacterView = () => (
    <div className="space-y-6 pb-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111827] p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">Character</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Choose your comic narrator</h2>
          </div>
          <button type="button" onClick={() => setView("transcript")} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">
            Back to transcript
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              selected={selectedCharacterId === character.id}
              onSelect={(id) => setSelectedCharacterId(id)}
            />
          ))}
        </div>

        <div className="mt-6 grid gap-4 rounded-[24px] border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-zinc-200">
            Script language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as ScriptLanguage)}
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-[#fbbf24]"
            >
              <option value="hinglish">Hinglish</option>
              <option value="hi">Hindi</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-200">
            Humor intensity
            <select
              value={humorIntensity}
              onChange={(event) => setHumorIntensity(event.target.value as HumorIntensity)}
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-[#fbbf24]"
            >
              <option value="low">Gentle</option>
              <option value="medium">Balanced</option>
              <option value="high">Extra punchy</option>
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-[24px] border border-[#fbbf24]/35 bg-[#fbbf24]/10 p-4 text-sm text-[#fde68a]">
          <p className="font-semibold">Selected: {currentCharacter?.name}</p>
          <p className="mt-1 text-[#fef3c7]">{currentCharacter?.voiceGuide}</p>
          <p className="mt-2 text-xs text-zinc-300">Speech is generated by Fish Audio using its expressive S2 model. Add your own licensed Fish voice ID for a specific voice.</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => generateScript()}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-full bg-[#fbbf24] px-5 py-3 font-semibold text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isBusy ? "Generating with Groq..." : "Generate script"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderScriptView = () => (
    <div className="space-y-6 pb-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111827] p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">Script</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Comedy script editor</h2>
          </div>
          <button type="button" onClick={() => setView("character")} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">
            Change character
          </button>
        </div>

        <textarea
          aria-label="Editable performance script"
          value={script}
          maxLength={5000}
          onChange={(event) => setScript(event.target.value)}
          rows={10}
          className="min-h-[220px] w-full rounded-[24px] border border-white/10 bg-black/20 p-4 text-base text-white outline-none"
        />
        <p className="mt-2 text-right text-xs text-zinc-400">{script.length}/5000 characters</p>

        <div className="mt-5 flex flex-wrap gap-3">
          {["Make it funnier", "More sarcastic", "More dramatic", "Make it motivational", "Breaking news"].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => generateScript(label)}
              disabled={isBusy}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generateVoice}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-full bg-[#fbbf24] px-5 py-3 font-semibold text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            {isBusy ? "Generating with Fish Audio..." : "Generate voice"}
          </button>
          <button type="button" disabled={isBusy} onClick={() => generateScript()} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6 pb-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111827] p-6">
        <div className="mb-6 grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
            <div className="rounded-[24px] bg-gradient-to-br from-[#fbbf24] via-[#f97316] to-[#7c2d12] p-4">
              <div className="flex items-center justify-center overflow-hidden rounded-[20px] bg-black/20 p-4">
                {currentCharacter ? (
                  <Image
                    src={currentCharacter.art}
                    alt={currentCharacter.name}
                    width={260}
                    height={260}
                    className="h-56 w-auto drop-shadow-[0_20px_30px_rgba(15,23,42,0.6)]"
                  />
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Performer</p>
                <h3 className="text-2xl font-bold text-white">{currentCharacter?.name}</h3>
              </div>
              <span className="rounded-full bg-[#fbbf24]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#fbbf24]">
                {currentCharacter?.label}
              </span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">Performance script</p>
              <p className="mt-3 text-base leading-8 text-zinc-100">{script || transcript}</p>
            </div>
            {audioUrl ? (
              <>
                <CaptionOverlay
                  text={script || transcript}
                  currentTime={playback.currentTime}
                  duration={playback.duration}
                />
                <AudioPlayer
                  src={audioUrl}
                  title={`${currentCharacter?.name} performance`}
                  onProgress={updatePlayback}
                />
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" disabled={isBusy} onClick={() => generateVoice()} className="inline-flex items-center gap-2 rounded-full bg-[#fbbf24] px-5 py-3 font-semibold text-[#111827] disabled:cursor-not-allowed disabled:opacity-50">
            <Play className="h-4 w-4" />
            Replay performance
          </button>
          <button type="button" onClick={handleDownload} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white">
            <Download className="h-4 w-4" />
            Download audio
          </button>
          <button type="button" onClick={handleCopyScript} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white">
            <Copy className="h-4 w-4" />
            Copy script
          </button>
          <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button type="button" onClick={saveLocally} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white">
            <Save className="h-4 w-4" />
            Save locally
          </button>
        </div>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <section className="space-y-6 pb-8">
      <div className="rounded-[32px] border border-white/10 bg-[#111827] p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">Private to this browser</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Saved performances</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Scripts are stored only on this device. Audio is not saved; load a script to generate its voice again.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportSavedPerformances}
              disabled={savedPerformances.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={clearLocalData}
              className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Clear local data
            </button>
          </div>
        </div>

        {savedPerformances.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-white/15 p-8 text-center">
            <Library className="mx-auto h-8 w-8 text-zinc-400" />
            <p className="mt-3 font-semibold text-white">No saved scripts yet</p>
            <p className="mt-1 text-sm text-zinc-400">Save a finished performance to keep its script here.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {savedPerformances.map((performance) => {
              const character = getCharacterById(performance.characterId);
              return (
                <li
                  key={performance.id}
                  className="flex flex-col justify-between gap-4 rounded-[24px] border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-[#fbbf24]">{character?.name}</span>
                      <time className="text-zinc-400" dateTime={performance.savedAt}>
                        {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
                          new Date(performance.savedAt),
                        )}
                      </time>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-200">{performance.script}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => loadSavedPerformance(performance)}
                      className="rounded-full bg-[#fbbf24] px-4 py-2 text-sm font-semibold text-[#111827]"
                    >
                      Open script
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete saved script by ${character?.name ?? "character"}`}
                      onClick={() => deleteSavedPerformance(performance.id)}
                      className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-right text-xs text-zinc-500">{savedPerformances.length}/{MAX_SAVED_PERFORMANCES} saved scripts</p>
      </div>
    </section>
  );

  const renderSharedPerformance = () => (
    <section className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-[#111827] p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">Shared MemeMic script</p>
      <h2 className="mt-2 text-3xl font-bold text-white">{currentCharacter?.name}</h2>
      <p className="mt-6 whitespace-pre-wrap rounded-[24px] border border-white/10 bg-black/20 p-5 text-base leading-8 text-zinc-100">
        {sharedPerformance?.script}
      </p>
      <p className="mt-4 text-sm text-zinc-400">
        Anyone with this link can read the included script. Audio is not included.
      </p>
      <button
        type="button"
        onClick={useSharedPerformance}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#fbbf24] px-5 py-3 font-semibold text-[#111827]"
      >
        <Wand2 className="h-4 w-4" />
        Use this script in MemeMic
      </button>
    </section>
  );

  return (
    <main className="min-h-screen bg-[#050816] text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <header className="mb-8 flex flex-col gap-5 rounded-[30px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#f97316] text-[#111827] shadow-[0_20px_30px_rgba(249,115,22,0.35)]">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">MemeMic</p>
              <h1 className="text-xl font-bold text-white">Comedy performance studio</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Groq + Fish Audio
            </span>
            <button type="button" onClick={() => setView("home")} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">
              Home
            </button>
            <button
              type="button"
              onClick={() => setView("library")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white"
            >
              <Library className="h-4 w-4" />
              Saved ({savedPerformances.length})
            </button>
            <Link
              href="/about"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#fbbf24]"
            >
              About us
            </Link>
          </div>
        </header>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
            {message}
          </div>
        ) : null}

        {view === "home" ? renderHome() : null}
        {view === "recording" ? renderRecording() : null}
        {view === "transcript" ? renderTranscript() : null}
        {view === "character" ? renderCharacterView() : null}
        {view === "script" ? renderScriptView() : null}
        {view === "performance" ? renderPerformance() : null}
        {view === "library" ? renderLibrary() : null}
        {view === "shared" ? renderSharedPerformance() : null}

        <footer className="mt-8 rounded-[28px] border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
          Fan-made entertainment experience. Characters are fictionalized comedy personas. AI-generated voices are original and are not the voices of, or endorsed by, any referenced comedians.
          <Link href="/about" className="ml-2 font-semibold text-[#fbbf24] underline-offset-4 hover:underline">
            Meet the creators
          </Link>
        </footer>
      </div>
    </main>
  );
}
