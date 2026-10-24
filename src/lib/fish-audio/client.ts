export async function generateSpeechAsset(text: string, characterId: string): Promise<ArrayBuffer> {
  const key = process.env.FISH_AUDIO_API_KEY;
  if (!key) {
    throw new Error("Fish Audio is not configured. Set FISH_AUDIO_API_KEY in the app environment.");
  }

  const model = process.env.FISH_AUDIO_MODEL || "s2.1-pro-free";
  const characterReferenceIdKey = `FISH_AUDIO_REFERENCE_ID_${characterId.toUpperCase().replace(/-/g, "_")}`;
  const referenceId = process.env[characterReferenceIdKey] || process.env.FISH_AUDIO_REFERENCE_ID;
  const response = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      model,
    },
    body: JSON.stringify({
      text,
      ...(referenceId ? { reference_id: referenceId } : {}),
      format: "mp3",
      temperature: 0.75,
      prosody: {
        speed: 1,
        normalize_loudness: true,
      },
    }),
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(errorBody?.message || `Fish Audio speech generation failed (${response.status}).`);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.startsWith("audio/") && contentType !== "application/octet-stream") {
    throw new Error("Fish Audio returned an unexpected response instead of audio.");
  }

  return response.arrayBuffer();
}
