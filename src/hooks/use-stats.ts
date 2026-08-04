import { useMemo } from "react";
import type { DiaryEntry } from "@/types";
import { countCharacters, countWords, computeStreaks, favoriteMood } from "@/lib/stats";

export interface DiaryStats {
  totalEntries: number;
  words: number;
  characters: number;
  currentStreak: number;
  longestStreak: number;
  favoriteMood: ReturnType<typeof favoriteMood>;
}

export function useStats(entries: DiaryEntry[]): DiaryStats {
  return useMemo(() => {
    let words = 0;
    let characters = 0;
    for (const entry of entries) {
      words += countWords(entry.content);
      characters += countCharacters(entry.content);
    }
    const streaks = computeStreaks(entries);
    return {
      totalEntries: entries.length,
      words,
      characters,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      favoriteMood: favoriteMood(entries),
    };
  }, [entries]);
}
