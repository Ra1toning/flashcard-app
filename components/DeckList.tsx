'use client';
import React from 'react';
import DeckCard from './DeckCard';
import type { Deck } from '../types';

type Props = {
  decks?: Deck[];
};

export default function DeckList({ decks = [] }: Props) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} />
      ))}
    </div>
  );
}