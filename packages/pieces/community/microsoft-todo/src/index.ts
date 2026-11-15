import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getGraphBaseUrl } from './lib/common/microsoft-cloud';
import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';

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
import { listTasksAction } from './lib/actions/list-tasks';
import { listTaskListsAction } from './lib/actions/list-task-lists';

import { microsoftTodoCompleteTaskAction } from './lib/actions/ai/complete-task';
import { microsoftTodoCreateChecklistItemAction } from './lib/actions/ai/create-checklist-item';
import { microsoftTodoCreateLinkedResourceAction } from './lib/actions/ai/create-linked-resource';
import { microsoftTodoCreateTaskAction } from './lib/actions/ai/create-task';
import { microsoftTodoCreateTaskListAction } from './lib/actions/ai/create-task-list';
import { microsoftTodoDeleteChecklistItemAction } from './lib/actions/ai/delete-checklist-item';
import { microsoftTodoDeleteLinkedResourceAction } from './lib/actions/ai/delete-linked-resource';
import { microsoftTodoDeleteTaskAction } from './lib/actions/ai/delete-task';
import { microsoftTodoDeleteTaskAttachmentAction } from './lib/actions/ai/delete-task-attachment';
import { microsoftTodoDeleteTaskListAction } from './lib/actions/ai/delete-task-list';
import { microsoftTodoDownloadTaskAttachmentAction } from './lib/actions/ai/download-task-attachment';
import { microsoftTodoGetChecklistItemAction } from './lib/actions/ai/get-checklist-item';
import { microsoftTodoGetCurrentUserAction } from './lib/actions/ai/get-current-user';
import { microsoftTodoGetLinkedResourceAction } from './lib/actions/ai/get-linked-resource';
import { microsoftTodoGetTaskAction } from './lib/actions/ai/get-task';
import { microsoftTodoGetTaskAttachmentAction } from './lib/actions/ai/get-task-attachment';
import { microsoftTodoGetTaskListAction } from './lib/actions/ai/get-task-list';
import { microsoftTodoListChecklistItemsAction } from './lib/actions/ai/list-checklist-items';
import { microsoftTodoListLinkedResourcesAction } from './lib/actions/ai/list-linked-resources';
import { microsoftTodoListTaskAttachmentsAction } from './lib/actions/ai/list-task-attachments';
import { microsoftTodoListTaskListsAction } from './lib/actions/ai/list-task-lists';
import { microsoftTodoMoveTaskAction } from './lib/actions/ai/move-task';
import { microsoftTodoSearchTasksAction } from './lib/actions/ai/search-tasks';
import { microsoftTodoListTasksAction } from './lib/actions/ai/list-tasks';
import { microsoftTodoUpdateChecklistItemAction } from './lib/actions/ai/update-checklist-item';
import { microsoftTodoUpdateLinkedResourceAction } from './lib/actions/ai/update-linked-resource';
import { microsoftTodoUpdateTaskAction } from './lib/actions/ai/update-task';
import { microsoftTodoUpdateTaskListAction } from './lib/actions/ai/update-task-list';
import { microsoftTodoUploadTaskAttachmentAction } from './lib/actions/ai/upload-task-attachment';

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
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-todo.png',
  authors: ['onyedikachi-david', 'david-oluwaseun420'],
  actions: [
    createTask,
    createTaskListAction,
    listTasksAction,
    listTaskListsAction,
    updateTaskAction,
    updateTaskListAction,
    completeTaskAction,
    deleteTaskAction,
    addAttachmentAction,
    getTaskAction,
    findTaskListByNameAction,
    findTaskByTitleAction,
    microsoftTodoCompleteTaskAction,
    microsoftTodoCreateChecklistItemAction,
    microsoftTodoCreateLinkedResourceAction,
    microsoftTodoCreateTaskAction,
    microsoftTodoCreateTaskListAction,
    microsoftTodoDeleteChecklistItemAction,
    microsoftTodoDeleteLinkedResourceAction,
    microsoftTodoDeleteTaskAction,
    microsoftTodoDeleteTaskAttachmentAction,
    microsoftTodoDeleteTaskListAction,
    microsoftTodoDownloadTaskAttachmentAction,
    microsoftTodoGetChecklistItemAction,
    microsoftTodoGetCurrentUserAction,
    microsoftTodoGetLinkedResourceAction,
    microsoftTodoGetTaskAction,
    microsoftTodoGetTaskAttachmentAction,
    microsoftTodoGetTaskListAction,
    microsoftTodoListChecklistItemsAction,
    microsoftTodoListLinkedResourcesAction,
    microsoftTodoListTaskAttachmentsAction,
    microsoftTodoListTaskListsAction,
    microsoftTodoListTasksAction,
    microsoftTodoSearchTasksAction,
    microsoftTodoMoveTaskAction,
    microsoftTodoUpdateChecklistItemAction,
    microsoftTodoUpdateLinkedResourceAction,
    microsoftTodoUpdateTaskAction,
    microsoftTodoUpdateTaskListAction,
    microsoftTodoUploadTaskAttachmentAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;
        return getGraphBaseUrl(cloud) + '/v1.0/me/todo';
      },
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
