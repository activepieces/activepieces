import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { googleTasksAddNewTaskAction } from './lib/actions/new-task';
import { newTaskTrigger } from './lib/triggers/new-task';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { googleTasksCommon } from './lib/common';

export const googleTasksAuth = PieceAuth.OAuth2({
  description: '',

  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: ['https://www.googleapis.com/auth/tasks'],
});

export const googleTasks = createPiece({
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-tasks.png',
  actions: [
    googleTasksAddNewTaskAction,
    createCustomApiCallAction({
      baseUrl: () => googleTasksCommon.baseUrl,
      auth: googleTasksAuth,
      authMapping: (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  displayName: 'Google Tasks',
  authors: ['abaza738', 'Salem-Alaa'],
  triggers: [newTaskTrigger],
  auth: googleTasksAuth,
});
