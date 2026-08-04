import { useEffect, useRef } from "react";

export type ShortcutCombo =
  | "mod+s"
  | "mod+f"
  | "mod+d"
  | "mod+1"
  | "mod+2"
  | "mod+3"
  | "mod+4"
  | "?"
  | "escape";

/**
 * Global keyboard shortcuts. Combos with a modifier always fire; plain keys
 * (like "?") never fire while the user is typing in an input or textarea.
 */
export function useKeyboardShortcuts(handlers: Partial<Record<ShortcutCombo, (e: KeyboardEvent) => void>>): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const fire = (combo: ShortcutCombo) => ref.current[combo]?.(e);

      if (mod && key === "s") {
        e.preventDefault();
        fire("mod+s");
        return;
      }
      if (mod && key === "f") {
        e.preventDefault();
        fire("mod+f");
        return;
      }
      if (mod && key === "d") {
        e.preventDefault();
        fire("mod+d");
        return;
      }
      if (mod && ["1", "2", "3", "4"].includes(key)) {
        e.preventDefault();
        fire(`mod+${key}` as ShortcutCombo);
        return;
      }
      if (e.key === "Escape") {
        fire("escape");
        return;
      }
      if (key === "?" && !isEditable && !mod && !e.altKey) {
        e.preventDefault();
        fire("?");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
