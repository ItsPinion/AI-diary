import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";
import "@/styles/fonts.css";

export const metadata: Metadata = {
  title: "Inkwell — a private diary",
  description:
    "A calm, handcrafted diary that lives entirely on your device. Write today's page, keep your moods, streaks and memories — no account, no cloud.",
  applicationName: "Inkwell",
  appleWebApp: { capable: true, title: "Inkwell", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF9F3" },
    { media: "(prefers-color-scheme: dark)", color: "#17130f" },
  ],
};

/** Apply the saved palette before React hydrates to avoid a flash. */
const themeBootScript = `try{var s=JSON.parse(localStorage.getItem('inkwell.settings.v1')||'null');if(s&&s.theme)document.documentElement.dataset.theme=s.theme}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Only a boolean crosses to the browser — never the key itself. Without a
  // key on the server the editor doesn't render the "Fix with AI" button at all.
  const aiEnabled = Boolean(process.env.GEMINI_API_KEY?.trim());

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <Providers aiEnabled={aiEnabled}>{children}</Providers>
      </body>
    </html>
  );
}
