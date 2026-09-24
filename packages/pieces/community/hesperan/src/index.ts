import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { askQuestion } from './lib/actions/ask-question';
import { decideWithProfile } from './lib/actions/decide-with-profile';
import { reportOutcome } from './lib/actions/report-outcome';
import { hesperanAuth } from './lib/auth';
import { HESPERAN_BASE_URL } from './lib/common/client';

export const hesperan = createPiece({
  displayName: 'Hesperan',
  description:
    'Calibrated decisions for automation: typed judgments with probabilities, and decision profiles that say when a decision is safe to automate.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/hesperan.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: hesperanAuth,
  authors: ['rawprogress'],
  actions: [
    decideWithProfile,
    askQuestion,
    reportOutcome,
    createCustomApiCallAction({
      baseUrl: () => HESPERAN_BASE_URL,
      auth: hesperanAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
