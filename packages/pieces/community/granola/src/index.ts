import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { listNotesAction } from './lib/actions/list-notes';
import { getNoteAction } from './lib/actions/get-note';
import { newNoteTrigger } from './lib/triggers/new-note';
import { updatedNoteTrigger } from './lib/triggers/updated-note';
import { BASE_URL, granolaApiCall } from './lib/common';

export const granolaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Open the **Granola desktop app**.
2. Go to **Settings > API**.
3. Click **Create API Key**.
4. Copy the key and paste it here.

**Note:** You need a Business or Enterprise plan to use API keys.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await granolaApiCall({
        method: HttpMethod.GET,
        path: '/notes?page_size=1',
        token: auth
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key' };
    }
  },
});

export const granola = createPiece({
  displayName: 'Granola',
  description:
    'AI-powered meeting notes — automatically captures and summarizes your meetings.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/granola.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: granolaAuth,
  authors: ['bst1n'],
  actions: [
    listNotesAction,
    getNoteAction,
    createCustomApiCallAction({
      baseUrl: () => BASE_URL,
      auth: granolaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [newNoteTrigger, updatedNoteTrigger],
});
