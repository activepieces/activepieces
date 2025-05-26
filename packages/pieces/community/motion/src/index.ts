import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { createProject } from './lib/actions/create-project';
import { getTask } from './lib/actions/get-task';
import { taskCreated } from './lib/triggers/task-created';

export const motionAuth = PieceAuth.SecretText({
  displayName: 'Motion API Key',
  description: 'Enter your Motion API key',
  required: true,
});

export const motion = createPiece({
  displayName: 'Motion',
  logoUrl: 'https://cdn.activepieces.com/pieces/motion.png',
  auth: motionAuth,
  authors: ['Sanket6652'],
  actions: [createTask, updateTask, createProject, getTask],
  triggers: [taskCreated],
});
