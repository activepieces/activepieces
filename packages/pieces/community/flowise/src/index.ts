import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { flowiseAuth } from './lib/auth';
import { flowiseClient } from './lib/common/client';
import { flowiseAiActions } from './lib/actions/ai';
import { makePredictionAction } from './lib/actions/make-prediction';

export const flowise = createPiece({
  displayName: 'Flowise',
  description: 'No-Code AI workflow builder',
  logoUrl: 'https://cdn.activepieces.com/pieces/flowise.png',
  auth: flowiseAuth,
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['aasimsani', 'kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [
    makePredictionAction,
    ...flowiseAiActions,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? flowiseClient.baseUrl({ auth }) : ''),
      auth: flowiseAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.access_token}`,
      }),
    }),
  ],
  triggers: [],
});
