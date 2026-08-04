/** Tiny typed event bus for cross-component commands (save now, focus search…). */

type Handler = () => void;

const listeners = new Map<string, Set<Handler>>();

export function on(event: string, handler: Handler): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
  return () => {
    listeners.get(event)?.delete(handler);
  };
}

export function emit(event: string): void {
  listeners.get(event)?.forEach((handler) => handler());
}

export const bus = { on, emit } as const;
