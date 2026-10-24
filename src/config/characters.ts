export type Character = {
  id: string;
  name: string;
  label: string;
  description: string;
  personality: string;
  voiceGuide: string;
  art: string;
  palette: [string, string, string];
  accent: string;
};

export const characters: Character[] = [
  {
    id: "somay-raina",
    name: "Somay Raina",
    label: "The Deadpan One",
    description: "Relaxed, dry, and bizarrely calm while the chaos unfolds.",
    personality:
      "Deadpan sarcasm, ironic observations, mock-serious timing, and understated punchlines.",
    voiceGuide:
      "Natural Indian male, slow-burn delivery, relaxed pauses, dry punchline emphasis, believable calm.",
    art: "/characters/somay-raina.jpeg",
    palette: ["#f59e0b", "#fbbf24", "#1f2937"],
    accent: "Warm gold",
  },
  {
    id: "harsh-gujraal",
    name: "Harsh Gujraal",
    label: "The Roaster",
    description: "Confident, energetic, and ready to turn excuses into comedy gold.",
    personality:
      "Expressive disbelief, playful teasing, exaggerated reactions, quick punchline bursts.",
    voiceGuide:
      "Lively Hindi-Hinglish, energetic pacing, crisp emphasis, teasing but never abusive.",
    art: "/characters/harsh-gujraal.jpeg",
    palette: ["#ef4444", "#f97316", "#7c2d12"],
    accent: "Fiery orange",
  },
  {
    id: "aakaash-guptaa",
    name: "Aakaash Guptaa",
    label: "The Storyteller",
    description: "Dramatic narrations with escalating absurdity and cinematic energy.",
    personality:
      "Animated scene-setting, dramatic turns, escalating absurdity, larger-than-life reactions.",
    voiceGuide:
      "Narration-heavy Hindi/Hinglish, expressive intonation, big transitions between calm and chaos.",
    art: "/characters/aakaash-guptaa.jpeg",
    palette: ["#8b5cf6", "#a78bfa", "#312e81"],
    accent: "Electric violet",
  },
  {
    id: "zakir-khaan",
    name: "Zakir Khaan",
    label: "The Emotional One",
    description: "Warm, relatable, and gentle even when the situation gets chaotic.",
    personality:
      "Personal anecdotes, affectionate teasing, heartfelt observations, mild wistfulness.",
    voiceGuide:
      "Hindi-first with natural Hinglish, measured pacing, restrained emotion, strong storytelling arc.",
    art: "/characters/zakir-khaan.jpeg",
    palette: ["#10b981", "#34d399", "#064e3b"],
    accent: "Green glow",
  },
  {
    id: "veer-daas",
    name: "Veer Daas",
    label: "The Observational One",
    description: "Sharp observations, clever irony, and a point-of-view that hits hard.",
    personality:
      "Structured storytelling, pointed punchlines, reflective irony, witty commentary.",
    voiceGuide:
      "Articulate Hinglish, clear enunciation, measured emphasis, sly observational tone.",
    art: "/characters/veer-daas.jpeg",
    palette: ["#06b6d4", "#22d3ee", "#164e63"],
    accent: "Cyan steel",
  },
  {
    id: "anubhav-singh-baassi",
    name: "Anubhav Singh Baassi",
    label: "The Relatable One",
    description: "Everyday chaos, awkward mistakes, and the kind of humor everyone understands.",
    personality:
      "Casual anecdotes, gradual escalation, relatable reactions, conversational rhythm.",
    voiceGuide:
      "Casual Hindi/Hinglish, conversational pace, gradually increasing energy, warm and honest.",
    art: "/characters/anubhav-singh-baassi.jpeg",
    palette: ["#ec4899", "#f472b6", "#831843"],
    accent: "Pink pop",
  },
];

export const defaultCharacterId = "somay-raina";

export function getCharacterById(id: string): Character | undefined {
  return characters.find((character) => character.id === id);
}
