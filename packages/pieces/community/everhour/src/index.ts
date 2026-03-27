import { createPiece } from '@activepieces/pieces-framework';
import { everhourAuth } from './lib/auth';
import { createTaskAction } from './lib/actions/create-task';
import { startTimerAction } from './lib/actions/start-timer';
import { stopTimerAction } from './lib/actions/stop-timer';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const everhour = createPiece({
  displayName: 'Everhour',
  description: 'Time tracking software that integrates into project management tools to track billable hours, set budgets, and monitor spending.',
  logoUrl: 'https://cdn.activepieces.com/pieces/everhour.png',
  minimumSupportedRelease: '0.36.1',
  authors: ['Slim-Hady'],
  auth: everhourAuth,
  actions: [
    createTaskAction,
    startTimerAction,
    stopTimerAction,
    createCustomApiCallAction({
      baseUrl: () => `https://api.everhour.com/`,
      auth: everhourAuth,
      authMapping: async (auth) => {
        return {
          'X-Api-Key': `${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
