import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { livesessionAuth } from './lib/common/auth';
import { sessionEvent } from './lib/triggers/session-event';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

export const livesession = createPiece({
  displayName: 'LiveSession',
  auth: livesessionAuth,
  minimumSupportedRelease: '0.36.1',
  description:
    'LLiveSession is the analytics platform that helps businesses scale up based on data.',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/livesession.png',
  authors: ['sanket-a11y'],
  actions: [
    createCustomApiCallAction({
      auth: livesessionAuth,
      baseUrl: () => 'https://api.livesession.io/v1',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [sessionEvent],
});
