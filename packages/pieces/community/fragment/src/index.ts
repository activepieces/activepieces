import { createPiece } from '@activepieces/pieces-framework';
import { fragmentAuth } from './lib/common';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { getTask } from './lib/actions/get-task';
import { listTasks } from './lib/actions/list-tasks';
import { deleteTask } from './lib/actions/delete-task';
import { customApiCall } from './lib/actions/custom-api-call';
import { newTaskTrigger } from './lib/triggers/new-task';
import { taskUpdatedTrigger } from './lib/triggers/task-updated';

export const fragment = createPiece({
  displayName: 'Fragment',
  auth: fragmentAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/fragment.png',
  authors: ["meenulekha-premakumar"],
  actions: [
    createTask,
    updateTask,
    getTask,
    listTasks,
    deleteTask,
    customApiCall,
  ],
  triggers: [
    newTaskTrigger,
    taskUpdatedTrigger,
  ],
});
