import { CHAT_SUGGESTION_CARD_IMAGE_IDS } from '@activepieces/shared';

function withUniqueArt<T extends { imageId: string }>(cards: T[]): T[] {
  const requested = new Set(cards.map((card) => card.imageId));
  const used = new Set<string>();
  return cards.map((card) => {
    const imageId = used.has(card.imageId)
      ? pickFreeArt({ used, requested }) ?? card.imageId
      : card.imageId;
    used.add(imageId);
    return { ...card, imageId };
  });
}

function pickFreeArt({
  used,
  requested,
}: {
  used: Set<string>;
  requested: Set<string>;
}): string | undefined {
  return (
    CHAT_SUGGESTION_CARD_IMAGE_IDS.find(
      (id) => !used.has(id) && !requested.has(id),
    ) ?? CHAT_SUGGESTION_CARD_IMAGE_IDS.find((id) => !used.has(id))
  );
}

export const useCaseArtIds = { withUniqueArt };
