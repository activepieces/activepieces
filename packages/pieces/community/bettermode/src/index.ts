import { createPiece } from '@activepieces/pieces-framework';
import { bettermodeAuth } from './lib/auth';
import { createDiscussionAction } from './lib/actions/create-discussion';
import { createQuestionAction } from './lib/actions/create-question';
import { assignBadgeAction } from './lib/actions/assign-badge';
import { revokeBadgeAction } from './lib/actions/revoke-badge';

export const bettermode = createPiece({
  displayName: 'Bettermode',
  auth: bettermodeAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bettermode.png',
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
