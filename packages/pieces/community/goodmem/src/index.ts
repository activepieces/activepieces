import { PieceAuth, createPiece, Property } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createMemory } from './lib/actions/create-memory';
import { retrieveMemories } from './lib/actions/retrieve-memories';
import { deleteMemory } from './lib/actions/delete-memory';
import { getMemory } from './lib/actions/get-memory';
import { createSpace } from './lib/actions/create-space';
import { deleteSpace } from './lib/actions/delete-space';
import { listSpaces } from './lib/actions/list-spaces';
import { getSpace } from './lib/actions/get-space';
import { updateSpace } from './lib/actions/update-space';
import { listMemories } from './lib/actions/list-memories';
import { listEmbedders } from './lib/actions/list-embedders';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const goodmemAuth = PieceAuth.CustomAuth({
  displayName: 'GoodMem Authentication',
  description: 'Connect to your GoodMem API instance for vector-based memory storage and semantic retrieval',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The base URL of your GoodMem API server (e.g., https://api.goodmem.ai or http://localhost:8080)',
      required: true,
    }),
    apiKey: Property.LongText({
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
  description: 'Store documents as memories with vector embeddings and perform similarity-based semantic retrieval using GoodMem',
  auth: goodmemAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0Ij48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxMiIgZmlsbD0iIzVCOUJGMiIvPjx0ZXh0IHg9IjMyIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsLEhlbHZldGljYSxzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkc8L3RleHQ+PC9zdmc+',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['bashareid'],
  actions: [
    createSpace,
    listSpaces,
    getSpace,
    updateSpace,
    deleteSpace,
    createMemory,
    retrieveMemories,
    getMemory,
    listMemories,
    deleteMemory,
    listEmbedders,
  ],
  triggers: [],
});
