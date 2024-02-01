import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { googleTasksAddNewTaskAction } from './lib/actions/new-task';
import { newTaskTrigger } from './lib/triggers/new-task';

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
  actions: [googleTasksAddNewTaskAction],
  categories: [PieceCategory.IT_OPERATIONS],
  displayName: 'Google Tasks',
  authors: ['abaza738', 'Salem-Alaa'],
  triggers: [newTaskTrigger],
  auth: googleTasksAuth,
});
