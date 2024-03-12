import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { getQuestion } from './lib/actions/get-question';
import { refreshSessionToken } from './lib/common';

export const metabaseAuth = PieceAuth.CustomAuth({
  description: 'Metabase authentication requires a username and password.',
  required: true,
  props: {
    username: Property.ShortText({
      displayName: 'User email',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Metabase API base URL',
      required: true,
    }),
    encryptionKey: PieceAuth.SecretText({
      displayName: 'Encryption key (for the session token)',
      description: 'Generate one with `openssl rand -hex 16`',
      required: true,
    }),
  },

  validate: async ({ auth }) => {
    try {
      await refreshSessionToken(auth);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key or Token',
      };
    }
  },
});
export const metabase = createPiece({
  displayName: 'Metabase',
  description: 'The simplest way to ask questions and learn from data',

  auth: metabaseAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/metabase.png',
  authors: ['AdamSelene', 'abuaboud'],
  actions: [getQuestion],
  triggers: [],
});
