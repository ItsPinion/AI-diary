"use client";

import * as React from "react";
import {
  Download,
  FileJson,
  FileText,
  LayoutPanelTop,
  RotateCcw,
  Sparkles,
  Type,
  Upload,
  Zap,
} from "lucide-react";
import { useDiary } from "@/hooks/use-diary";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { AUTOSAVE_OPTIONS } from "@/constants/settings";
import { downloadFile, entriesToJson, entriesToMarkdown, entriesToTxt, parseImport } from "@/lib/export";
import { todayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { DiaryEntry, FontSize } from "@/types";

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex rounded-xl bg-background-secondary p-1 ring-1 ring-border">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === option.value
              ? "bg-card text-foreground shadow-sm ring-1 ring-border"
              : "text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { entries, settings, updateSettings, importEntries, resetAll } = useDiary();
  const { toast } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = React.useState<{ entries: DiaryEntry[]; fileName: string } | null>(null);
  const [confirmReset, setConfirmReset] = React.useState(false);

  const stamp = todayKey();

  const doExport = (kind: "json" | "md" | "txt") => {
    if (entries.length === 0) {
      toast({ title: "Nothing to export yet", variant: "info" });
      return;
    }
    if (kind === "json") {
      downloadFile(`inkwell-${stamp}.json`, entriesToJson(entries), "application/json");
    } else if (kind === "md") {
      downloadFile(`inkwell-${stamp}.md`, entriesToMarkdown(entries), "text/markdown");
    } else {
      downloadFile(`inkwell-${stamp}.txt`, entriesToTxt(entries), "text/plain");
    }
    toast({ title: "Export ready", description: "Saved to your downloads.", variant: "success" });
  };

  const onFileChosen = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImport(text);
      setPendingImport({ entries: parsed, fileName: file.name });
    } catch (error) {
      toast({
        title: "Couldn't import that file",
        description: error instanceof Error ? error.message : "The file is not a valid Inkwell export.",
        variant: "error",
      });
    }
  };

  const closePending = () => {
    setPendingImport(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyImport = (mode: "merge" | "replace") => {
    if (!pendingImport) return;
    importEntries(pendingImport.entries, mode);
    toast({
      title: "Pages restored",
      description: `${pendingImport.entries.length} page${pendingImport.entries.length === 1 ? "" : "s"} ${
        mode === "merge" ? "merged" : "restored"
      } into your diary.`,
      variant: "success",
    });
    closePending();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Everything is stored locally in your browser. The one exception: when you ask Gemini
              to fix a page, that page&apos;s text is sent to Google.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-7">
            <Section icon={<LayoutPanelTop className="h-3.5 w-3.5" />} title="Appearance">
              <ThemeSwitcher variant="list" />
              <div className="grid gap-4 pt-1 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type size</Label>
                  <Segmented<FontSize>
                    ariaLabel="Type size"
                    value={settings.fontSize}
                    options={[
                      { value: "sm", label: "Small" },
                      { value: "md", label: "Medium" },
                      { value: "lg", label: "Large" },
                    ]}
                    onChange={(fontSize) => updateSettings({ fontSize })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Compact layout</Label>
                  <div className="flex items-center justify-between rounded-xl bg-background-secondary px-3.5 py-2.5 ring-1 ring-border">
                    <span className="text-xs text-muted">Tighter spacing</span>
                    <Switch
                      checked={settings.compact}
                      onCheckedChange={(compact) => updateSettings({ compact })}
                      aria-label="Compact layout"
                    />
                  </div>
                </div>
              </div>
            </Section>

            <Separator />

            <Section icon={<Zap className="h-3.5 w-3.5" />} title="Writing">
              <div className="space-y-2">
                <Label>Autosave</Label>
                <Segmented
                  ariaLabel="Autosave interval"
                  value={settings.autosaveMs}
                  options={AUTOSAVE_OPTIONS}
                  onChange={(autosaveMs) => updateSettings({ autosaveMs })}
                />
                <p className="text-xs text-faint">Your words are also saved when you leave the page.</p>
              </div>
            </Section>

            <Separator />

            <Section icon={<Sparkles className="h-3.5 w-3.5" />} title="AI proofreading">
              <div className="space-y-2">
                <Label htmlFor="gemini-api-key">Gemini API key</Label>
                <Input
                  id="gemini-api-key"
                  type="password"
                  value={settings.geminiApiKey}
                  onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                  placeholder="Paste your Gemini API key (AIza…)"
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs leading-5 text-faint">
                  Optional — powers the “Fix writing” button on each page. The key is stored on this
                  device like the rest of your diary, and your text is sent to Google Gemini only
                  when you press that button. Get a free key at{" "}
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
                  >
                    aistudio.google.com
                  </a>
                  .
                </p>
              </div>
            </Section>

            <Separator />

            <Section icon={<Download className="h-3.5 w-3.5" />} title="Your data">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => doExport("json")}>
                  <FileJson className="h-4 w-4" /> JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => doExport("md")}>
                  <FileText className="h-4 w-4" /> Markdown
                </Button>
                <Button variant="outline" size="sm" onClick={() => doExport("txt")}>
                  <FileText className="h-4 w-4" /> Plain text
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Import
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  aria-label="Import diary JSON"
                  onChange={(e) => {
                    void onFileChosen(e.target.files?.[0]);
                  }}
                />
              </div>

              {pendingImport && (
                <div className="rounded-2xl border border-accent/25 bg-accent/6 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {pendingImport.entries.length} page{pendingImport.entries.length === 1 ? "" : "s"} found in{" "}
                    <span className="font-semibold">{pendingImport.fileName}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Merge keeps your current pages (imported pages win conflicts). Replace erases everything first.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => applyImport("merge")}>
                      Merge
                    </Button>
                    <Button size="sm" variant="soft" onClick={() => applyImport("replace")}>
                      Replace all
                    </Button>
                    <Button size="sm" variant="ghost" onClick={closePending}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Reset diary</p>
                  <p className="text-xs text-muted">Erase every page and start fresh.</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
            </Section>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
            <span className="flex items-center gap-1.5 text-xs text-faint">
              <Type className="h-3.5 w-3.5" /> Inkwell · v1.0 · offline diary
            </span>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Erase your whole diary?"
        description="Every page, mood and star will be removed from this device. Export a backup first if you might want it back."
        confirmLabel="Erase everything"
        onConfirm={() => {
          resetAll();
          toast({ title: "Diary erased", description: "A fresh page is waiting for you.", variant: "info" });
        }}
      />
    </>
  );
}
