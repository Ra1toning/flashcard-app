import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import AppProviders from "@/components/AppProviders";
import PersistentNavBar from "@/components/NavBar";
import BottomNav from "@/components/BottomNav";
import AmbientBackdrop from "@/components/ui/AmbientBackdrop";
import RouteTransition from "@/components/ui/RouteTransition";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://nudleye.vercel.app"),
  title: {
    default: "Nudleye - Хар, тогтоо, давт",
    template: "%s | Nudleye",
  },
  description: "Үгээ илүү амархан тогтоож, flashcard ашиглан өдөр бүр давтаарай.",
  applicationName: "Nudleye",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Nudleye - Хар, тогтоо, давт",
    description: "Үгээ илүү амархан тогтоож, flashcard ашиглан өдөр бүр давтаарай.",
    images: [{ url: "/logo.png", width: 600, height: 600, alt: "Nudleye" }],
  },
  twitter: {
    card: "summary",
    title: "Nudleye - Хар, тогтоо, давт",
    description: "Үгээ илүү амархан тогтоож, flashcard ашиглан өдөр бүр давтаарай.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className={`${manrope.variable} ${unbounded.variable} antialiased`}>
        <AppProviders>
          <AmbientBackdrop />
          <PersistentNavBar />
          <main className="relative z-10 min-h-screen"><RouteTransition>{children}</RouteTransition></main>
          <BottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
