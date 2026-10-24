import Image from "next/image";
import type { Character } from "@/config/characters";

type CharacterCardProps = {
  character: Character;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function CharacterCard({ character, selected, onSelect }: CharacterCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(character.id)}
      className={`group relative w-full overflow-hidden rounded-[28px] border text-left transition-all duration-200 ${
        selected
          ? "border-[#fbbf24] bg-[#1f2937] shadow-[0_20px_50px_rgba(251,191,36,0.18)]"
          : "border-white/10 bg-black/20 hover:border-white/30 hover:bg-white/5"
      }`}
      aria-pressed={selected}
    >
      <div className="relative h-52 overflow-hidden">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `linear-gradient(135deg, ${character.palette[0]} 0%, ${character.palette[1]} 30%, ${character.palette[2]} 100%)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 top-12 flex items-center justify-center">
          <Image
            src={character.art}
            alt={character.name}
            width={180}
            height={180}
            className="h-36 w-auto drop-shadow-[0_20px_30px_rgba(15,23,42,0.45)]"
          />
        </div>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{character.name}</h3>
          {selected ? <span className="rounded-full bg-[#fbbf24] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#111827]">Selected</span> : null}
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#fbbf24]">{character.label}</p>
        <p className="text-sm text-zinc-300">{character.description}</p>
      </div>
    </button>
  );
}
