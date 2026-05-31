import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createEmbeddings } from './lib/actions/create-embeddings';
import { voxellForgeAuth } from './lib/auth';

export const voxellForge = createPiece({
  displayName: 'Voxell Forge',
  description: 'Managed embeddings API for AI search, retrieval, and semantic workflows.',
  auth: voxellForgeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/voxell-forge.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['JCorners68'],
  actions: [
    createEmbeddings,
    createCustomApiCallAction({
      auth: voxellForgeAuth,
      baseUrl: () => 'https://api.voxell.ai/v1',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
