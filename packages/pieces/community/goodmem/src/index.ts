import {
  PieceAuth,
  createPiece,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createMemory } from './lib/actions/create-memory';
import { retrieveMemories } from './lib/actions/retrieve-memories';
import { deleteMemory } from './lib/actions/delete-memory';
import { getMemory } from './lib/actions/get-memory';
import { createSpace } from './lib/actions/create-space';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const goodmemAuth = PieceAuth.CustomAuth({
  displayName: 'GoodMem Authentication',
  description:
    'Connect to your GoodMem API instance for vector-based memory storage and semantic retrieval',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description:
        'The base URL of your GoodMem API server (e.g., https://api.goodmem.ai or http://localhost:8080)',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your GoodMem API key for authentication (X-API-Key)',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const baseUrl = auth.baseUrl.replace(/\/$/, '');
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/spaces`,
        headers: {
          'X-API-Key': auth.apiKey,
          'Content-Type': 'application/json',
        },
      });
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API key or base URL. Please check your credentials.',
      };
    }
  },
  required: true,
});

export const goodmem = createPiece({
  displayName: 'GoodMem',
  description:
    'Store documents as memories with vector embeddings and perform similarity-based semantic retrieval using GoodMem',
  auth: goodmemAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/goodmem.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['bashareid', 'sanket-a11y'],
  actions: [
    createSpace,
    createMemory,
    retrieveMemories,
    getMemory,
    deleteMemory,
  ],
  triggers: [],
});
