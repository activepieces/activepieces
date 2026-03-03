import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { googleTasksAddNewTaskAction } from './lib/actions/new-task';
import { googleTasksCommon } from './lib/common';
import { newTaskTrigger } from './lib/triggers/new-task';
import { googleTasksAuth } from './lib/auth';

export const googleTasks = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-tasks.png',
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    googleTasksAddNewTaskAction,
    createCustomApiCallAction({
      baseUrl: () => googleTasksCommon.baseUrl,
      auth: googleTasksAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  displayName: 'Google Tasks',
  description: 'Task list management application',

  authors: ["Salem-Alaa","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  triggers: [newTaskTrigger],
  auth: googleTasksAuth,
});
