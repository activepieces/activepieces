import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { readwiseAuth } from './lib/common/auth';
import { READWISE_BASE_URL } from './lib/common/client';
import { getHighlights } from './lib/actions/get-highlights';
import { createHighlight } from './lib/actions/create-highlight';
import { newHighlight } from './lib/triggers/new-highlight';

export const readwise = createPiece({
  displayName: 'Readwise',
  description:
    'Save and retrieve your highlights from Readwise — your reading notes, all in one place.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/readwise.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['tosh2308'],
  auth: readwiseAuth,
  actions: [
    getHighlights,
    createHighlight,
    createCustomApiCallAction({
      baseUrl: () => READWISE_BASE_URL,
      auth: readwiseAuth,
      authMapping: async (auth) => ({
        Authorization: `Token ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newHighlight],
});

export { readwiseAuth };
