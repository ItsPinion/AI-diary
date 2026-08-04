export interface Quote {
  text: string;
  author: string;
}

/** Short, mostly public-domain lines about writing, memory and noticing. */
export const QUOTES: Quote[] = [
  { text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard" },
  { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
  { text: "The pages are still blank, but there is a miraculous feeling of the words being there, written in invisible ink.", author: "Vladimir Nabokov" },
  { text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: "Anne Lamott" },
  { text: "To make a prairie it takes a clover and one bee. One clover, and a bee, and revery.", author: "Emily Dickinson" },
  { text: "I can shake off everything as I write; my sorrows disappear, my courage is reborn.", author: "Anne Frank" },
  { text: "The world is full of magic things, patiently waiting for our senses to grow sharper.", author: "W. B. Yeats" },
  { text: "Tell me, what is it you plan to do with your one wild and precious life?", author: "Mary Oliver" },
  { text: "Every day is a journey, and the journey itself is home.", author: "Matsuo Bashō" },
  { text: "Write it on your heart that every day is the best day in the year.", author: "Ralph Waldo Emerson" },
  { text: "We write to taste life twice, in the moment and in retrospect.", author: "Anaïs Nin" },
  { text: "Nothing is softer or more flexible than water, yet nothing can resist it.", author: "Lao Tzu" },
  { text: "The beginning is the most important part of the work.", author: "Plato" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot" },
  { text: "Not I, nor anyone else, can travel that road for you. You must travel it yourself.", author: "Walt Whitman" },
  { text: "Happiness is not a station you arrive at, but a manner of traveling.", author: "Margaret Lee Runbeck" },
  { text: "Live in each season as it passes; breathe the air, drink the drink, taste the fruit.", author: "Henry David Thoreau" },
  { text: "The pen is the tongue of the mind.", author: "Cervantes" },
  { text: "A day without a friend is like a pot without a single drop of honey left inside.", author: "Winnie the Pooh" },
  { text: "And, when you want something, all the universe conspires in helping you to achieve it.", author: "Paulo Coelho" },
  { text: "Wherever you go, go with all your heart.", author: "Confucius" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Softly, quietly, remember what is good.", author: "Inkwell" },
];

/** One quote per day of the year, stable across the day. */
export function quoteForDay(date: Date): Quote {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length];
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return "Still awake";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
