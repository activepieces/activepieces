import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { askLocalAI } from './lib/actions/send-prompt';

export const localaiAuth = PieceAuth.CustomAuth({
  props: {
    base_url: Property.ShortText({
      displayName: 'Server URL',
      description: 'LocalAI Instance URL',
      required: true,
    }),
    access_token: Property.ShortText({
      displayName: 'Access Token',
      description: 'LocalAI Access Token',
      required: false,
    }),
  },
  required: true,
});
export const openai = createPiece({
  displayName: 'LocalAI',
  description:
    'The free, Self-hosted, community-driven and local-first. Drop-in replacement for OpenAI running on consumer-grade hardware. No GPU required.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/localai.jpeg',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: localaiAuth,
  actions: [
    askLocalAI,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { base_url: string }).base_url,
      auth: localaiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${
          (auth as { access_token: string }).access_token || ''
        }`,
      }),
    }),
  ],
  authors: ["hkboujrida","kishanprmr","MoShizzle","abuaboud"],
  triggers: [],
});
