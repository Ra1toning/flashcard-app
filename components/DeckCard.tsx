'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Clock, Circle, ArrowRight } from 'lucide-react';
import type { Deck } from '../types';

type Props = {
  deck: Deck;
};

export default function DeckCard({ deck }: Props) {
  const router = useRouter();

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <button 
        onClick={() => router.push(`/deck/${deck.id}`)}
        className="relative w-full bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all overflow-hidden text-left"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h4 className="font-semibold text-lg">{deck.name}</h4>
            <div className="flex items-center gap-1 text-xs bg-white/10 px-2 py-1 rounded-lg">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>{deck.streak}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/60 mb-4">
            <span>{deck.words} үг</span>
            <Circle className="w-1 h-1 fill-current" />
            <span>{deck.mastered} эзэмшсэн</span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Явц</span>
              <span className="font-medium">{deck.progress}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500" 
                style={{ width: `${deck.progress}%` }} 
              />
            </div>
          </div>

          {deck.dueToday > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-400 bg-orange-400/10 px-3 py-2 rounded-lg mb-4">
              <Clock className="w-3 h-3" />
              <span>{deck.dueToday} үг өнөөдөр давтах</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-sm text-white/60">Сургалт эхлүүлэх</span>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </button>
    </div>
  );
}