'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Deck } from '../types';

type Props = {
  deck: Deck;
};

export default function DeckCard({ deck }: Props) {
  const router = useRouter();

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1CB0F6] to-[#8549BA] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
      <button 
        onClick={() => router.push(`/deck/${deck.id}`)}
        className="relative w-full glass-card-dark rounded-2xl hover:scale-[1.02] transition-all duration-200 overflow-hidden text-left group/card"
      >
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <h4 className="font-bold text-lg md:text-xl text-white group-hover/card:text-[#1CB0F6] transition-colors duration-200">{deck.name}</h4>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FF9600] to-[#FFC800] shadow-lg">
              <Flame className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white">{deck.streak}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>{deck.words} үг</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#58CC02]" />
              <span>{deck.mastered} эзэмшсэн</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60 font-medium">Явц</span>
              <span className="font-bold text-[#1CB0F6]">{deck.progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#1CB0F6] to-[#58CC02] rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${deck.progress}%` }} 
              />
            </div>
          </div>

          {deck.dueToday > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#FFC715] bg-[#FFC715]/10 px-3 py-2 rounded-xl mb-4 border border-[#FFC715]/20">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{deck.dueToday} үг өнөөдөр давтах</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-sm text-white/60 font-medium">Сургалт эхлүүлэх</span>
            <ArrowRight className="w-5 h-5 text-[#1CB0F6] group-hover/card:translate-x-1 transition-transform duration-200" />
          </div>
        </div>
      </button>
    </div>
  );
}

function BookOpen({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}