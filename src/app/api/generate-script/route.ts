import { NextRequest, NextResponse } from "next/server";
import { getCharacterById } from "@/config/characters";
import { consumeRateLimit, readJsonBody } from "@/lib/api-guards";
import { generateComedyScriptWithGroq } from "@/lib/groq/client";
import {
  validateCharacterId,
  validateHumorIntensity,
  validateRemixInstruction,
  validateScriptLanguage,
  validateStory,
} from "@/lib/validation";

export async function POST(request: NextRequest) {
  const rateLimit = consumeRateLimit(request, "generate-script", 8, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many script requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const parsed = await readJsonBody(request, 8 * 1024);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  const body = parsed.value;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Story and character are required." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  let story: string;
  let characterId: string;
  let remixInstruction: string | undefined;
  let humorIntensity: "low" | "medium" | "high";
  let language: "hi" | "hinglish" | "en";
  try {
    story = validateStory(typeof payload.story === "string" ? payload.story : "");
    characterId = validateCharacterId(typeof payload.characterId === "string" ? payload.characterId : "");
    remixInstruction = validateRemixInstruction(payload.remixInstruction);
    humorIntensity = payload.humorIntensity === undefined ? "medium" : validateHumorIntensity(payload.humorIntensity);
    language = payload.language === undefined ? "hinglish" : validateScriptLanguage(payload.language);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Story and character are required.",
      },
      { status: 400 },
    );
  }

  const character = getCharacterById(characterId);
  if (!character) {
    return NextResponse.json({ error: "Choose one of the available characters." }, { status: 400 });
  }

  try {
    const script = await generateComedyScriptWithGroq({
      story,
      characterId,
      remixInstruction,
      humorIntensity,
      language,
    }, character);

    return NextResponse.json({
      ok: true,
      script,
      provider: "groq",
      message: "Comedy script generated with Groq.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Script generation failed.";
    const status = message.includes("not configured") ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
