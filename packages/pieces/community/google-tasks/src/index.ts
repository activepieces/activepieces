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

export const googleTasksAuth = PieceAuth.OAuth2({
  description: '',

  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: ['https://www.googleapis.com/auth/tasks'],
});

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
