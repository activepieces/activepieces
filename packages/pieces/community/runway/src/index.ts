import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import * as actions from './lib/actions';

export const runwayAuth = PieceAuth.CustomAuth({
  description: 'Please visit https://runwayml.com/ to get your API Key',
  props: {
    api_key: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  required: true,
});

export const runway = createPiece({
  displayName: 'Runway',
  description: 'AI-powered content generation platform for creating high-quality images using text prompts and managing generation tasks.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/runway.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['YourName'],
  auth: runwayAuth,
  actions: [
    actions.generateImageFromText,
    actions.generateVideoFromImage,
    actions.getTaskDetails,
    actions.cancelOrDeleteTask,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.runwayml.com',
      auth: runwayAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { api_key: string }).api_key}`,
      }),
    }),
  ],
  triggers: [],
});
