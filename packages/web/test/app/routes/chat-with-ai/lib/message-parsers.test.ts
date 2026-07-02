// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import {
  normalizePieceName,
  pickDefaultConnectionExternalId,
} from '@/app/routes/chat-with-ai/lib/message-parsers';

describe('pickDefaultConnectionExternalId', () => {
  it('returns null when there are no healthy connections', () => {
    expect(
      pickDefaultConnectionExternalId({
        healthy: [],
        updatedByExternalId: {},
      }),
    ).toBeNull();
  });

  it('pre-selects the most-recently-updated healthy connection', () => {
    const result = pickDefaultConnectionExternalId({
      healthy: [{ externalId: 'a' }, { externalId: 'b' }, { externalId: 'c' }],
      updatedByExternalId: {
        a: '2024-01-01T00:00:00.000Z',
        b: '2024-06-01T00:00:00.000Z',
        c: '2024-03-01T00:00:00.000Z',
      },
    });
    expect(result).toBe('b');
  });

  it('prefers a connection with a timestamp over one without', () => {
    const result = pickDefaultConnectionExternalId({
      healthy: [{ externalId: 'a' }, { externalId: 'b' }],
      updatedByExternalId: { b: '2024-01-01T00:00:00.000Z' },
    });
    expect(result).toBe('b');
  });

  it('falls back to the first connection when no timestamps are available', () => {
    const result = pickDefaultConnectionExternalId({
      healthy: [{ externalId: 'a' }, { externalId: 'b' }],
      updatedByExternalId: {},
    });
    expect(result).toBe('a');
  });
});

describe('normalizePieceName (re-exported from @activepieces/shared)', () => {
  it.each([
    ['Attio', '@activepieces/piece-attio'],
    ['attio', '@activepieces/piece-attio'],
    ['Google Sheets', '@activepieces/piece-google-sheets'],
    ['google_sheets', '@activepieces/piece-google-sheets'],
    ['@activepieces/piece-Attio', '@activepieces/piece-attio'],
  ])('canonicalizes %s -> %s', (input, expected) => {
    expect(normalizePieceName(input)).toBe(expected);
  });
});
