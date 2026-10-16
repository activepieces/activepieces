import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { deleteDataPointAction } from './lib/actions/delete-data-point';
import { ingestAction } from './lib/actions/ingest';
import { recallAction } from './lib/actions/recall';
import { pastDevAuth } from './lib/auth';
import { pastDevClient } from './lib/common/client';

export const pastdotdev = createPiece({
  displayName: 'past dev',
  description:
    'past dev is a memory API for AI agents. Ingest data points, then recall what matters with dated, cited sources.',
  auth: pastDevAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://past.dev/icon-512.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.DEVELOPER_TOOLS],
  authors: ['louistissot'],
  actions: [
    ingestAction,
    recallAction,
    deleteDataPointAction,
    createCustomApiCallAction({
      auth: pastDevAuth,
      baseUrl: (auth) =>
        `${pastDevClient.resolveBaseUrl({ apiHost: auth?.props.apiHost })}/api/v1`,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.apiKey}`,
      }),
    }),
  ],
  triggers: [],
});
