import type { MoodId } from "@/types";

export interface MoodMeta {
  id: MoodId;
  label: string;
  emoji: string;
  /** Brand colour used for dots, chips and tints. */
  color: string;
}

export const MOODS: MoodMeta[] = [
  { id: "happy", label: "Happy", emoji: "😊", color: "#E8A93D" },
  { id: "calm", label: "Calm", emoji: "😌", color: "#6FA88C" },
  { id: "loved", label: "Loved", emoji: "❤️", color: "#D96B87" },
  { id: "sad", label: "Sad", emoji: "😔", color: "#7A93C4" },
  { id: "angry", label: "Angry", emoji: "😡", color: "#D97757" },
  { id: "tired", label: "Tired", emoji: "😴", color: "#9B87B8" },
  { id: "excited", label: "Excited", emoji: "🤩", color: "#E8953F" },
  { id: "anxious", label: "Anxious", emoji: "😨", color: "#8B9DC9" },
];

export const MOOD_MAP: Record<MoodId, MoodMeta> = MOODS.reduce(
  (acc, mood) => {
    acc[mood.id] = mood;
    return acc;
  },
  {} as Record<MoodId, MoodMeta>,
);

export const MOOD_ORDER: MoodId[] = MOODS.map((m) => m.id);

export function moodById(id: MoodId | null): MoodMeta | null {
  return id ? MOOD_MAP[id] : null;
}
