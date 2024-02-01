import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { assignBadgeAction } from './lib/actions/assign-badge';
import { createDiscussionAction } from './lib/actions/create-discussion';
import { createQuestionAction } from './lib/actions/create-question';
import { revokeBadgeAction } from './lib/actions/revoke-badge';
import { bettermodeAuth } from './lib/auth';

export const bettermode = createPiece({
  displayName: 'Bettermode',
  auth: bettermodeAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bettermode.png',
  categories: [PieceCategory.MARKETING],
  authors: ['joeworkman'],
  actions: [
    createDiscussionAction,
    createQuestionAction,
    assignBadgeAction,
    revokeBadgeAction,
  ],
  triggers: [],
});

// Bettermode API docs: https://developers.bettermode.com/
