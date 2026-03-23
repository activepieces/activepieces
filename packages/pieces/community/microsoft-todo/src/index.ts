import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { addAttachmentAction } from './lib/actions/add-attachment';
import { completeTaskAction } from './lib/actions/complete-task';
import { createTask } from './lib/actions/create-task';
import { createTaskListAction } from './lib/actions/create-task-list';
import { deleteTaskAction } from './lib/actions/delete-task';
import { findTaskByTitleAction } from './lib/actions/find-task-by-title';
import { findTaskListByNameAction } from './lib/actions/find-task-list-by-name';
import { getTaskAction } from './lib/actions/get-task';
import { updateTaskAction } from './lib/actions/update-task';
import { updateTaskListAction } from './lib/actions/update-task-list';

import { microsoftToDoAuth } from './lib/auth';
import { newListCreatedTrigger } from './lib/triggers/new-list-created';
import { newTaskCreatedTrigger } from './lib/triggers/new-task-created';
import { taskCompletedTrigger } from './lib/triggers/task-completed';
import { newOrUpdatedTaskTrigger } from './lib/triggers/task-updated';

export const microsoftTodo = createPiece({
  displayName: 'Microsoft To Do',
  description: 'Cloud based task management application.',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: microsoftToDoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-todo.png',
  authors: ['onyedikachi-david', 'david-oluwaseun420'],
  actions: [
    createTask,
    createTaskListAction,
    updateTaskAction,
    updateTaskListAction,
    completeTaskAction,
    deleteTaskAction,
    addAttachmentAction,
    getTaskAction,
    findTaskListByNameAction,
    findTaskByTitleAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://graph.microsoft.com/v1.0/me/todo',
      auth: microsoftToDoAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    newTaskCreatedTrigger,
    newOrUpdatedTaskTrigger,
    newListCreatedTrigger,
    taskCompletedTrigger,
  ],
});
