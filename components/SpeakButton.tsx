"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";

function pickKoreanVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const korean = voices.filter((voice) => voice.lang.toLowerCase().startsWith("ko"));
  if (korean.length === 0) return null;
  return (
    korean.find((voice) => /natural/i.test(voice.name)) ??
    korean.find((voice) => /google/i.test(voice.name)) ??
    korean.find((voice) => !voice.localService) ??
    korean[0]
  );
}

export default function SpeakButton({ text, className = "" }: { text: string; className?: string }) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    function update() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      setVoice(pickKoreanVoice(voices));
    }
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  if (!voice) return null;

  function speak(event: React.MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (!voice) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={speak}
      aria-label="Дуудлагыг сонсох"
      title="Дуудлагыг сонсох"
      className={`grid h-9 w-9 place-items-center rounded-full border border-[#e2ddd0] bg-white/90 text-[#84530f] shadow-sm transition hover:bg-[#fff1c7] ${className}`}
    >
      <Volume2 className="h-4 w-4" />
    </button>
  );
}
