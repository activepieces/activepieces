import { PieceAuth, createPiece, Property } from '@activepieces/pieces-framework';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { completeTask } from './lib/actions/complete-task';
import { deleteTask } from './lib/actions/delete-task';
import { getTaskDetails } from './lib/actions/get-task-details';
import { getProjectById } from './lib/actions/get-project-by-id';
import { newTaskCreated } from './lib/triggers/new-task-created';
import { taskCompleted } from './lib/triggers/task-completed';
import { findTaskByTitle } from './lib/actions/find-task-by-title';

export const ticktickAuth = PieceAuth.OAuth2({
  description: "OAuth2 authentication",
  authUrl: "https://ticktick.com/oauth/authorize",
  tokenUrl: "https://ticktick.com/oauth/token",
  required: true,
  scope: ['tasks:read', 'tasks:write'],
  props: {
      client_id: Property.ShortText({
          displayName: 'Client ID',
          required: true,
      }),
      client_secret: PieceAuth.SecretText({
          displayName: 'Client Secret',
          required: true,
      }),
  }
});

export const ticktick = createPiece({
  displayName: 'TickTick',
  logoUrl: 'https://cdn.activepieces.com/pieces/ticktick.png',
  auth: ticktickAuth,
  authors: ["onyedikachi-david"],
  actions: [
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    getTaskDetails,
    getProjectById,
    findTaskByTitle
  ],
  triggers: [newTaskCreated, taskCompleted],
});
