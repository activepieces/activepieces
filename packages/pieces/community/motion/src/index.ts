import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { createProject } from './lib/actions/create-project';
import { getTask } from './lib/actions/get-task';
import { taskCreated } from './lib/triggers/task-created';
import { moveTask } from './lib/actions/move-task';
import { PieceCategory } from '@activepieces/shared';
import { findTask } from './lib/actions/find-task';
import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/props';

export const motionAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can obtain API key from [API Settings](https://app.usemotion.com/web/settings/api).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/workspaces`,
        headers: {
          'X-API-Key': auth,
        },
      });

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
  },
});

export const motion = createPiece({
  displayName: 'Motion',
  logoUrl: 'https://cdn.activepieces.com/pieces/motion.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: motionAuth,
  authors: ['Sanket6652', 'kishanprmr'],
  actions: [
    createTask,
    updateTask,
    createProject,
    getTask,
    moveTask,
    findTask,
    createCustomApiCallAction({
      auth: motionAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          'X-API-Key': auth as string,
        };
      },
    }),
  ],
  triggers: [taskCreated],
});
