import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { browseAiAuth } from './lib/common/auth';
import { getTaskDetailsAction } from './lib/actions/get-task-details';
import { listRobotsAction } from './lib/actions/list-robots';
import { runRobotAction } from './lib/actions/run-robot';
import { taskFinishedWithErrorTrigger } from './lib/triggers/task-finished-with-error';
import { taskFinishedSuccessfully } from './lib/triggers/task-finished-successfully';

export const browseAi = createPiece({
  displayName: 'Browse AI',
  auth: browseAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/browse-ai.png',
  authors: ['aryel780'],
  actions: [
    getTaskDetailsAction,
    listRobotsAction,
    runRobotAction,
    createCustomApiCallAction({
      auth: browseAiAuth,
      baseUrl: () => 'https://api.browse.ai/v2',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [
    taskFinishedWithErrorTrigger,
    taskFinishedSuccessfully,
  ],
});
