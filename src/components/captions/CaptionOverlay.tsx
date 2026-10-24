type CaptionOverlayProps = {
  text: string;
  currentTime: number;
  duration: number;
};

export function CaptionOverlay({ text, currentTime, duration }: CaptionOverlayProps) {
  const ratio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const spokenText = text.replace(/\[[^\]]+\]/g, "").trim();
  const captionSegments = spokenText
    .split(/(?<=[.!?।])\s+/)
    .filter(Boolean)
    .flatMap((sentence) => {
      const words = sentence.split(/\s+/);
      return Array.from({ length: Math.ceil(words.length / 8) }, (_, index) =>
        words.slice(index * 8, (index + 1) * 8).join(" "),
      );
    });
  const segmentWordCounts = captionSegments.map((segment) => segment.split(/\s+/).length);
  const totalWords = segmentWordCounts.reduce((count, wordCount) => count + wordCount, 0);
  const targetWord = ratio * totalWords;
  const activeSegmentIndex = captionSegments.findIndex(
    (_, index) => targetWord < segmentWordCounts.slice(0, index + 1).reduce((count, words) => count + words, 0),
  );
  const activeCaption = captionSegments[activeSegmentIndex] ?? captionSegments.at(-1) ?? spokenText;

  return (
    <div className="rounded-[30px] border border-white/10 bg-black/35 p-4 backdrop-blur-sm" aria-live="polite">
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-[#fbbf24] via-[#f97316] to-[#f472b6]" style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className="min-h-16 text-center text-base leading-relaxed text-white md:text-lg">{activeCaption}</p>
    </div>
  );
}
