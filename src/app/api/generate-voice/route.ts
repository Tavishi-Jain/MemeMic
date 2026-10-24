import { NextRequest, NextResponse } from "next/server";
import { getCharacterById } from "@/config/characters";
import { consumeRateLimit, readJsonBody } from "@/lib/api-guards";
import { generateSpeechAsset } from "@/lib/fish-audio/client";
import { validateCharacterId, validateScript } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const rateLimit = consumeRateLimit(request, "generate-voice", 4, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many voice requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const parsed = await readJsonBody(request, 12 * 1024);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  const body = parsed.value;
  if (
    !body ||
    typeof body !== "object" ||
    !("text" in body) ||
    typeof body.text !== "string" ||
    !("characterId" in body) ||
    typeof body.characterId !== "string"
  ) {
    return NextResponse.json({ error: "Script text and character are required." }, { status: 400 });
  }

  let text: string;
  let characterId: string;
  try {
    text = validateScript(body.text);
    characterId = validateCharacterId(body.characterId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Script text and character are required." },
      { status: 400 },
    );
  }

  if (!getCharacterById(characterId)) {
    return NextResponse.json({ error: "Choose one of the available characters." }, { status: 400 });
  }

  try {
    const audio = await generateSpeechAsset(text, characterId);

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'inline; filename="mememic-performance.mp3"',
        "Cache-Control": "no-store",
      },
    }    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Speech generation failed.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message.includes("not configured") ? 503 : 502 },
    );
  }
}
