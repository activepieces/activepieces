import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
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
  description: 'Use LocalAi to generate text',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/localai.jpeg',
  auth: localaiAuth,
  actions: [askLocalAI],
  authors: ['hboujrida'],
  triggers: [],
});
