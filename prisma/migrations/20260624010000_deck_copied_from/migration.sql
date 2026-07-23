-- AlterTable
ALTER TABLE "Deck" ADD COLUMN "copiedFromId" TEXT;

-- CreateIndex
CREATE INDEX "Deck_copiedFromId_idx" ON "Deck"("copiedFromId");

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_copiedFromId_fkey" FOREIGN KEY ("copiedFromId") REFERENCES "Deck"("id") ON DELETE SET NULL ON UPDATE CASCADE;
