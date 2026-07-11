import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { CHAT_SUGGESTION_CARD_IMAGE_IDS } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

// Personalized use-case cards reuse the stock card art by imageId, validated
// against CHAT_SUGGESTION_CARD_IMAGE_IDS in @activepieces/shared. This pins
// the const to the actual .webp assets so neither can drift silently.
describe('CHAT_SUGGESTION_CARD_IMAGE_IDS', () => {
  const cardsDir = resolve(__dirname, '../../../public/chat-suggestions/cards');

  it.each([...CHAT_SUGGESTION_CARD_IMAGE_IDS])(
    'has a webp asset for %s',
    (imageId) => {
      expect(existsSync(resolve(cardsDir, `${imageId}.webp`))).toBe(true);
    },
  );
});
