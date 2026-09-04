"use client";

import * as React from "react";
import {
  CircleCheck,
  CircleX,
  Download,
  Eye,
  EyeOff,
  FileJson,
  HardDriveDownload,
  LoaderCircle,
  PlugZap,
  WandSparkles,
  FileText,
  LayoutPanelTop,
  RotateCcw,
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
import { AUTOSAVE_OPTIONS, BACKUP_REMINDER_OPTIONS } from "@/constants/settings";
import { downloadBackup, downloadFile, entriesToJson, entriesToMarkdown, entriesToTxt, parseImport } from "@/lib/export";
import { testGeminiKey } from "@/lib/ai/test-key";
import type { KeyTestResult } from "@/lib/ai/proofread";
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
  const { entries, settings, updateSettings, importEntries, resetAll, backup, aiEnabled } = useDiary();
  const { toast } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = React.useState<{ entries: DiaryEntry[]; fileName: string } | null>(null);
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [keyDraft, setKeyDraft] = React.useState(settings.geminiApiKey);
  const [revealKey, setRevealKey] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [keyTest, setKeyTest] = React.useState<(KeyTestResult & { saved?: boolean }) | null>(null);

  const stamp = todayKey();

  /** Commit on blur so typing doesn't hammer localStorage. */
  const saveKey = (value: string) => {
    const next = value.trim();
    if (next === settings.geminiApiKey) return false;
    updateSettings({ geminiApiKey: next });
    return true;
  };

  /**
   * Test whatever is in the box — or the server key when it is empty — and
   * keep a key that passes, so nobody tests a key and forgets to save it.
   */
  const handleTestKey = async () => {
    setTesting(true);
    setKeyTest(null);
    const candidate = keyDraft.trim();
    try {
      const result = await testGeminiKey(candidate || undefined);
      const saved = result.ok && candidate ? saveKey(candidate) : false;
      setKeyTest({ ...result, saved });
      if (!result.ok) {
        toast({ title: "That key didn't work", description: result.error, variant: "error" });
      }
    } finally {
      setTesting(false);
    }
  };

  const clearKey = () => {
    setKeyDraft("");
    setKeyTest(null);
    updateSettings({ geminiApiKey: "" });
    toast({
      title: "Key removed",
      description: aiEnabled ? "Falling back to the server key." : "Fix with AI is hidden until a key exists.",
      variant: "info",
    });
  };

  const lastBackupLabel = settings.lastBackupAt
    ? new Date(settings.lastBackupAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  const handleBackup = () => {
    if (entries.length === 0) {
      toast({ title: "Nothing to back up yet", variant: "info" });
      return;
    }
    const name = downloadBackup(entries);
    updateSettings({ lastBackupAt: new Date().toISOString() });
    toast({
      title: "Backup downloaded",
      description: `${entries.length} page${entries.length === 1 ? "" : "s"} saved to ${name}.`,
      variant: "success",
    });
  };

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
              Your diary never leaves this device — everything is stored locally in your browser.
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

            <Section icon={<HardDriveDownload className="h-3.5 w-3.5" />} title="Backups">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background-secondary/60 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Full backup</p>
                  <p className="text-xs text-muted">
                    {backup.pages} page{backup.pages === 1 ? "" : "s"} in one JSON file ·{" "}
                    {lastBackupLabel ? `last backed up ${lastBackupLabel}` : "never backed up"}
                  </p>
                </div>
                <Button size="sm" onClick={handleBackup}>
                  <HardDriveDownload className="h-4 w-4" /> Back up now
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Remind me to back up</Label>
                <Segmented
                  ariaLabel="Backup reminder"
                  value={settings.backupReminderDays}
                  options={BACKUP_REMINDER_OPTIONS}
                  onChange={(backupReminderDays) => updateSettings({ backupReminderDays })}
                />
                <p className="text-xs text-faint">
                  {settings.backupReminderDays === 0
                    ? "Reminders are off. You can still back up any time from here."
                    : "A nudge appears in the sidebar when pages have changed since your last backup."}{" "}
                  Restore a backup with <span className="text-muted">Import</span> below.
                </p>
              </div>
            </Section>

            <Separator />

            <Section icon={<WandSparkles className="h-3.5 w-3.5" />} title="AI writing assistant">
              <div className="space-y-2">
                <Label htmlFor="gemini-api-key">Gemini API key</Label>
                <div className="flex gap-2">
                  <Input
                    id="gemini-api-key"
                    type={revealKey ? "text" : "password"}
                    value={keyDraft}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={aiEnabled ? "Using the server key — add your own to override" : "AIza…"}
                    aria-describedby="gemini-api-key-help"
                    onChange={(e) => {
                      setKeyDraft(e.target.value);
                      setKeyTest(null);
                    }}
                    onBlur={(e) => saveKey(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleTestKey();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    aria-pressed={revealKey}
                    aria-label={revealKey ? "Hide API key" : "Show API key"}
                    onClick={() => setRevealKey((reveal) => !reveal)}
                  >
                    {revealKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => void handleTestKey()} disabled={testing}>
                    {testing ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlugZap className="h-4 w-4" />
                    )}
                    {testing ? "Testing…" : keyDraft.trim() ? "Test key" : "Test server key"}
                  </Button>
                  {settings.geminiApiKey && (
                    <Button size="sm" variant="ghost" onClick={clearKey}>
                      Clear
                    </Button>
                  )}
                  {keyTest && !testing && (
                    <span
                      role="status"
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs",
                        keyTest.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {keyTest.ok ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}
                      {keyTest.ok
                        ? `${keyTest.saved ? "Saved and working" : keyTest.source === "server" ? "Server key works" : "Works"} — ${keyTest.model} in ${keyTest.ms} ms`
                        : keyTest.error}
                    </span>
                  )}
                  {testing && (
                    <span role="status" className="animate-pulse-soft text-xs text-muted">
                      Contacting Gemini…
                    </span>
                  )}
                </div>

                <p id="gemini-api-key-help" className="text-xs text-faint">
                  Get a key from{" "}
                  <a
                    className="text-accent underline-offset-4 hover:underline"
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google AI Studio
                  </a>
                  . It is stored in this browser and sent only to your own Inkwell server, which
                  forwards it to Google. Leave it blank to use the server&rsquo;s{" "}
                  <code className="text-muted">GEMINI_API_KEY</code>
                  {aiEnabled ? " (already configured)" : " (not set)"}. Pressing{" "}
                  <span className="font-medium text-muted">Fix with AI</span> sends the open page to
                  Gemini — nothing else leaves your device.
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
