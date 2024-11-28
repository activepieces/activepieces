import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { assignBadgeAction } from './lib/actions/assign-badge';
import { createDiscussionAction } from './lib/actions/create-discussion';
import { createQuestionAction } from './lib/actions/create-question';
import { revokeBadgeAction } from './lib/actions/revoke-badge';
import { bettermodeAuth } from './lib/auth';

export const bettermode = createPiece({
  displayName: 'Bettermode',
  description: 'Feature-rich engagement platform. Browse beautifully designed templates, each flexible for precise customization to your needs.',
  auth: bettermodeAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bettermode.png',
  categories: [PieceCategory.MARKETING],
  authors: ["joeworkman","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createDiscussionAction,
    createQuestionAction,
    assignBadgeAction,
    revokeBadgeAction,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { region: string }).region, // replace with the actual base URL
      auth: bettermodeAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});

// Bettermode API docs: https://developers.bettermode.com/
