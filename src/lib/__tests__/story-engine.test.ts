import { describe, expect, it } from "vitest";
import { characters } from "@/config/characters";
import { parseSavedPerformances } from "@/lib/saved-performances";
import { decodeSharedPerformance, encodeSharedPerformance } from "@/lib/share-link";
import { generateComedyScript, getDemoTranscript } from "@/lib/story-engine";
import {
  validateHumorIntensity,
  validateScript,
  validateScriptLanguage,
  validateStory,
} from "@/lib/validation";

describe("MemeMic config and validation", () => {
  it("exposes six published characters", () => {
    expect(characters).toHaveLength(6);
    expect(characters[0].name).toBe("Somay Raina");
  });

  it("uses the supplied portraits for all six characters", () => {
    expect(characters.map(({ id, art }) => [id, art])).toEqual([
      ["somay-raina", "/characters/somay-raina.jpeg"],
      ["harsh-gujraal", "/characters/harsh-gujraal.jpeg"],
      ["aakaash-guptaa", "/characters/aakaash-guptaa.jpeg"],
      ["zakir-khaan", "/characters/zakir-khaan.jpeg"],
      ["veer-daas", "/characters/veer-daas.jpeg"],
      ["anubhav-singh-baassi", "/characters/anubhav-singh-baassi.jpeg"],
    ]);
  });

  it("accepts a valid story", () => {
    const story = "Aaj college mein teacher ne poocha aur maine pure confidence ke saath bol diya ki main samajh gaya.";
    expect(validateStory(story)).toContain("teacher");
  });

  it("throws on empty input", () => {
    expect(() => validateStory("")).toThrow("Please add a story");
  });

  it("validates script settings and size", () => {
    expect(validateScriptLanguage("hi")).toBe("hi");
    expect(validateHumorIntensity("high")).toBe("high");
    expect(() => validateScriptLanguage("fr")).toThrow("Choose Hindi");
    expect(() => validateHumorIntensity("extreme")).toThrow("humor intensity");
    expect(() => validateScript("x".repeat(5001))).toThrow("5000 characters");
  });

  it("loads only valid saved scripts for known characters", () => {
    const raw = JSON.stringify([
      {
        id: "valid",
        script: "A saved comedy script.",
        characterId: "somay-raina",
        savedAt: "2026-10-24T10:00:00.000Z",
      },
      {
        id: "invalid-character",
        script: "A script with an invalid character.",
        characterId: "unknown",
        savedAt: "2026-10-24T11:00:00.000Z",
      },
    ]);

    expect(parseSavedPerformances(raw).map(({ id }) => id)).toEqual(["valid"]);
  });

  it("encodes and decodes private-fragment share links with Unicode scripts", () => {
    const performance = { script: "[excited] Namaste, dosto! Kya scene hai?", characterId: "somay-raina" };

    expect(decodeSharedPerformance(encodeSharedPerformance(performance))).toEqual(performance);
    expect(decodeSharedPerformance("not-valid-base64")).toBeNull();
  });

  it("provides a demo transcript and script", () => {
    const transcript = getDemoTranscript("Aaj college ka scene bahut weird tha.");
    const script = generateComedyScript({
      story: transcript,
      characterId: "somay-raina",
    });

    expect(transcript.length).toBeGreaterThan(10);
    expect(script.script.length).toBeGreaterThan(40);
    expect(script.provider).toBe("demo");
  });
});
