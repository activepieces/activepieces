import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sliteAuth } from './lib/auth';
import { sliteApi } from './lib/common/client';
import { sliteAskQuestionAction } from './lib/actions/ask-question';
import { sliteCreateDocAction } from './lib/actions/create-doc';
import { sliteFetchSubDocsAction } from './lib/actions/fetch-sub-docs';
import { sliteReplaceDocAction } from './lib/actions/replace-doc';
import { sliteIndexAskxObjectAction } from './lib/actions/index-askx-object';
import { sliteFetchDocAction } from './lib/actions/fetch-doc';
import { sliteSearchDocsAction } from './lib/actions/search-docs';
import { sliteUpdateDocAction } from './lib/actions/update-doc';

export const slite = createPiece({
  displayName: 'Slite',
  description:
    'Slite is a modern knowledge base. Create, search, update, and ask questions about your team docs.',
  auth: sliteAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/slite.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['onyedikachi-david'],
  actions: [
    sliteAskQuestionAction,
    sliteCreateDocAction,
    sliteFetchSubDocsAction,
    sliteReplaceDocAction,
    sliteIndexAskxObjectAction,
    sliteFetchDocAction,
    sliteSearchDocsAction,
    sliteUpdateDocAction,
    createCustomApiCallAction({
      baseUrl: () => sliteApi.baseUrl,
      auth: sliteAuth,
      authMapping: async (auth) => ({
        'x-slite-api-key': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
