import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { browseAiAuth } from './lib/common/auth';
import { get } from 'http';
import { getTaskDetails } from './lib/actions/get-task-details';
import { listRobots } from './lib/actions/list-robots';
import { runRobot } from './lib/actions/run-robot';
import { taskFinishedSuccessfully } from './lib/triggers/task-finished-successfully';
import { taskFinishedWithError } from './lib/triggers/task-finished-with-error';

export const browseAi = createPiece({
  displayName: 'Browse-ai',
  auth: browseAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/browse-ai.png',
  authors: ['Sanket6652'],
  actions: [
    getTaskDetails,
    listRobots,
    runRobot
  ],
  triggers: [
    taskFinishedSuccessfully,
    taskFinishedWithError
  ],
});
