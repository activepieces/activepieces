import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getHighlights } from './lib/actions/get-highlights';
import { createHighlight } from './lib/actions/create-highlight';
import { newHighlight } from './lib/triggers/new-highlight';

export const readwiseAuth = PieceAuth.SecretText({
  displayName: 'Access Token',
  description:
    'Your Readwise access token. Get it at https://readwise.io/access_token',
  required: true,
  validate: async ({ auth }) => {
    const response = await fetch('https://readwise.io/api/v2/auth/', {
      headers: { Authorization: `Token ${auth}` },
    });
    if (response.status === 204) return { valid: true };
    return { valid: false, error: 'Invalid Readwise access token.' };
  },
});

export const readwise = createPiece({
  displayName: 'Readwise',
  description: 'Save and retrieve your highlights from Readwise — your reading notes, all in one place.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/readwise.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['tosh2308'],
  auth: readwiseAuth,
  actions: [getHighlights, createHighlight],
  triggers: [newHighlight],
});
