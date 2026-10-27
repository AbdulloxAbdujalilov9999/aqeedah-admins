// Shape of the AI source suggestions, shared by the API route and the editor.
export type Confidence = "high" | "medium" | "low";
export type QuranRef = { surah: number; surah_name: string; ayah_from: number; ayah_to: number; point: string; confidence: Confidence };
export type HadithRef = { collection: string; number: string; narrator: string; grading: string; summary: string; point: string; confidence: Confidence };
export type FiqhRef = { book: string; author: string; location: string; position: string; confidence: Confidence };
export type Suggestions = { quran: QuranRef[]; hadith: HadithRef[]; fiqh: FiqhRef[]; note: string };

const conf = { type: "string", enum: ["high", "medium", "low"] };
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const SUGGESTIONS_SCHEMA = obj({
  quran: {
    type: "array",
    items: obj({
      surah: { type: "integer" },
      surah_name: { type: "string" },
      ayah_from: { type: "integer" },
      ayah_to: { type: "integer" },
      point: { type: "string" },
      confidence: conf,
    }),
  },
  hadith: {
    type: "array",
    items: obj({
      collection: { type: "string", enum: ["bukhari", "muslim", "abudawud", "tirmidhi", "nasai", "ibnmajah", "malik", "ahmad", "other"] },
      number: { type: "string" },
      narrator: { type: "string" },
      grading: { type: "string" },
      summary: { type: "string" },
      point: { type: "string" },
      confidence: conf,
    }),
  },
  fiqh: {
    type: "array",
    items: obj({
      book: { type: "string" },
      author: { type: "string" },
      location: { type: "string" },
      position: { type: "string" },
      confidence: conf,
    }),
  },
  note: { type: "string" },
});
