"use client";

import { use } from "react";
import DeckEditor from "@/components/DeckEditor";

export default function EditDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <DeckEditor deckId={id} />;
}
