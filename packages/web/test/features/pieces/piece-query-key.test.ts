/**
 * @vitest-environment jsdom
 */
import { PieceAudienceFilter } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { pieceQueryOptions } from '@/features/pieces/hooks/pieces-hooks';

describe('pieceQueryOptions.key', () => {
  it('gives a single latest piece and a list of latest pieces the same cache entry', () => {
    expect(
      pieceQueryOptions.key({
        name: '@activepieces/piece-gmail',
        version: undefined,
        language: 'en',
      }),
    ).toEqual(
      pieceQueryOptions.latest({
        name: '@activepieces/piece-gmail',
        language: 'en',
      }).queryKey,
    );
  });

  it('keeps a separate entry when an audience or project is asked for', () => {
    expect(
      pieceQueryOptions.key({
        name: '@activepieces/piece-gmail',
        version: undefined,
        language: 'en',
        audience: PieceAudienceFilter.ALL,
      }),
    ).not.toEqual(
      pieceQueryOptions.latest({
        name: '@activepieces/piece-gmail',
        language: 'en',
      }).queryKey,
    );
  });
});
