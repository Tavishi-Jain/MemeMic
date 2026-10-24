import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/api-guards";
import { transcribeAudioWithGroq } from "@/lib/groq/client";
import { MAX_AUDIO_SIZE_BYTES } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = consumeRateLimit(request, "transcribe", 5, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many recording requests. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json({ error: "Recording is too large. Keep it under 20MB." }, { status: 413 });
    }

    if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Audio must be sent as multipart form data." }, { status: 415 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "The audio upload could not be read." }, { status: 400 });
    }
    const file = formData.get("audio");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No audio file was provided." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The recording is empty. Please try again." }, { status: 400 });
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      return NextResponse.json({ error: "Recording is too large. Keep it under 20MB." }, { status: 413 });
    }

    if (file.type && !file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Upload an audio recording to transcribe." }, { status: 415 });
    }

    try {
      const transcript = await transcribeAudioWithGroq(file);
      return NextResponse.json({
        ok: true,
        transcript,
        message: "Recording transcribed with Groq. Review and edit it before continuing.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transcription failed.";
      return NextResponse.json(
        { ok: false, error: message },
        { status: message.includes("not configured") ? 503 : 502 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Transcription failed.",
      },
      { status: 500 },
    );
  }
}
