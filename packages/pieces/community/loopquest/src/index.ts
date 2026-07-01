import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { loopquestAuth } from './lib/auth';
import { createReviewTask } from './lib/actions/create-review-task';
import { getTaskStatus } from './lib/actions/get-task-status';
import { newVerdict } from './lib/triggers/new-verdict';

export const loopquest = createPiece({
  displayName: 'LoopQuest',
  description:
    'Human-in-the-loop review for AI output — gate an automation until a person approves, or monitor its quality in the background.',
  auth: loopquestAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://loopquest.tomphillips.uk/icon.svg',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
  authors: ['TomPhillipsLabs'],
  actions: [createReviewTask, getTaskStatus],
  triggers: [newVerdict],
});
