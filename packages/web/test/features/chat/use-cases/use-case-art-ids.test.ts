import { CHAT_SUGGESTION_CARD_IMAGE_IDS } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { useCaseArtIds } from '@/features/chat/use-cases/use-case-art-ids';

describe('useCaseArtIds.withUniqueArt', () => {
  it('gives each card a different art when the model repeats one', () => {
    const cards = [
      { key: 'a', imageId: 'plan-week' },
      { key: 'b', imageId: 'run-my-day' },
      { key: 'c', imageId: 'plan-week' },
      { key: 'd', imageId: 'run-my-day' },
    ];

    const result = useCaseArtIds.withUniqueArt(cards);

    expect(new Set(result.map((card) => card.imageId)).size).toBe(4);
    expect(result[0].imageId).toBe('plan-week');
    expect(result[1].imageId).toBe('run-my-day');
  });

  it('does not take an art a later card asked for', () => {
    const cards = [
      { key: 'a', imageId: 'plan-week' },
      { key: 'b', imageId: 'plan-week' },
      { key: 'c', imageId: CHAT_SUGGESTION_CARD_IMAGE_IDS[0] },
    ];

    const result = useCaseArtIds.withUniqueArt(cards);

    expect(result[2].imageId).toBe(CHAT_SUGGESTION_CARD_IMAGE_IDS[0]);
    expect(new Set(result.map((card) => card.imageId)).size).toBe(3);
  });

  it('keeps cards that already have unique art unchanged', () => {
    const cards = [
      { key: 'a', imageId: 'plan-week' },
      { key: 'b', imageId: 'tame-inbox' },
    ];

    expect(useCaseArtIds.withUniqueArt(cards)).toEqual(cards);
  });
});
