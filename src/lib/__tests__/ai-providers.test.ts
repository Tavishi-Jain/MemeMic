import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { characters } from "@/config/characters";
import { generateSpeechAsset } from "@/lib/fish-audio/client";
import { generateComedyScriptWithGroq, transcribeAudioWithGroq } from "@/lib/groq/client";

describe("AI provider clients", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "test-groq-key");
    vi.stubEnv("GROQ_MODEL", "openai/gpt-oss-120b");
    vi.stubEnv("GROQ_TRANSCRIPTION_MODEL", "whisper-large-v3-turbo");
    vi.stubEnv("FISH_AUDIO_API_KEY", "test-fish-key");
    vi.stubEnv("FISH_AUDIO_MODEL", "s2.1-pro-free");
    vi.stubEnv("FISH_AUDIO_REFERENCE_ID", "");
    vi.stubEnv("FISH_AUDIO_REFERENCE_ID_SOMAY_RAINA", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("generates a character-specific expressive script with Groq", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ choices: [{ message: { content: "[sarcastic] Arre, kya scene tha!" } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const script = await generateComedyScriptWithGroq(
      {
        story: "Meri bus bina ruke nikal gayi, aur main late ho gaya.",
        characterId: "somay-raina",
        language: "hinglish",
      },
      characters[0],
    );

    expect(script).toBe("[sarcastic] Arre, kya scene tha!");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-groq-key" }),
      }),
    );
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };
    expect(requestBody.model).toBe("openai/gpt-oss-120b");
    const systemPrompt = requestBody.messages[0].content;
    const prompt = JSON.parse(requestBody.messages[1].content) as {
      character: { name: string; deliveryGuide: string };
    };
    expect(prompt.character.name).toBe("Somay Raina");
    expect(prompt.character.deliveryGuide).toBe(characters[0].voiceGuide);
    expect(systemPrompt).toContain("natural Hindi/Hinglish");
  });

  it("passes selected language and humor intensity into the generation prompt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ choices: [{ message: { content: "A short English joke." } }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateComedyScriptWithGroq(
      {
        story: "I missed the bus because I was checking the route.",
        characterId: "somay-raina",
        language: "en",
        humorIntensity: "high",
      },
      characters[0],
    );

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      messages: Array<{ content: string }>;
    };
    expect(requestBody.messages[0].content).toContain("English");
    expect(requestBody.messages[0].content).toContain("high");
  });

  it("transcribes the uploaded recording through Groq", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ text: "The bus left before I arrived." }));
    vi.stubGlobal("fetch", fetchMock);
    const audio = new File(["audio bytes"], "recording.webm", { type: "audio/webm" });

    const transcript = await transcribeAudioWithGroq(audio);

    expect(transcript).toBe("The bus left before I arrived.");
    const requestBody = fetchMock.mock.calls[0][1].body as FormData;
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.groq.com/openai/v1/audio/transcriptions");
    expect(requestBody.get("model")).toBe("whisper-large-v3-turbo");
    expect(requestBody.get("file")).toBeInstanceOf(File);
  });

  it("rejects audio transcription when Groq is not configured", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const audio = new File(["audio bytes"], "recording.webm", { type: "audio/webm" });

    await expect(transcribeAudioWithGroq(audio)).rejects.toThrow("Groq is not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not generate a demo script when Groq is unconfigured", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      generateComedyScriptWithGroq(
        { story: "Meri bus bina ruke nikal gayi, aur main late ho gaya.", characterId: "somay-raina" },
        characters[0],
      ),
    ).rejects.toThrow("Groq is not configured. Set GROQ_API_KEY in the app environment.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces authentication errors returned by Groq", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify("Incorrect API key provided."), { status: 401 })),
    );

    await expect(
      generateComedyScriptWithGroq(
        { story: "Meri bus bina ruke nikal gayi, aur main late ho gaya.", characterId: "somay-raina" },
        characters[0],
      ),
    ).rejects.toThrow("Incorrect API key provided.");
  });

  it("synthesizes MP3 audio through Fish Audio S2", async () => {
    const audioBytes = new Uint8Array([73, 68, 51, 1, 2, 3]);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(audioBytes, { headers: { "Content-Type": "audio/mpeg" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const audio = await generateSpeechAsset("[excited] Namaste, dosto!", "somay-raina");

    expect(Array.from(new Uint8Array(audio))).toEqual(Array.from(audioBytes));
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.fish.audio/v1/tts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-fish-key",
          model: "s2.1-pro-free",
        }),
      }),
    );
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      text: string;
      format: string;
    };
    expect(requestBody).toMatchObject({ text: "[excited] Namaste, dosto!", format: "mp3" });
  });

  it("uses Somay's dedicated Fish Audio voice model ID", async () => {
    vi.stubEnv("FISH_AUDIO_REFERENCE_ID", "default-model");
    vi.stubEnv("FISH_AUDIO_REFERENCE_ID_SOMAY_RAINA", "somay-model");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([73, 68, 51]), { headers: { "Content-Type": "audio/mpeg" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateSpeechAsset("Hello, Somay!", "somay-raina");

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      reference_id: string;
    };
    expect(requestBody.reference_id).toBe("somay-model");
  });

  it("uses the shared Fish Audio voice when no character-specific ID is set", async () => {
    vi.stubEnv("FISH_AUDIO_REFERENCE_ID", "default-model");
    vi.stubEnv("FISH_AUDIO_REFERENCE_ID_SOMAY_RAINA", "");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([73, 68, 51]), { headers: { "Content-Type": "audio/mpeg" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateSpeechAsset("Hello!", "somay-raina");

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      reference_id: string;
    };
    expect(requestBody.reference_id).toBe("default-model");
  });

  it("does not fall back to generated demo audio when Fish Audio is unconfigured", async () => {
    vi.stubEnv("FISH_AUDIO_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateSpeechAsset("Namaste, dosto!", "somay-raina")).rejects.toThrow(
      "Fish Audio is not configured. Set FISH_AUDIO_API_KEY in the app environment.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
