import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { taskCreated } from './lib/triggers/task-created';
import { taskCompleted } from './lib/triggers/task-completed';
import { newAttachment } from './lib/triggers/new-attachment';
import { newPerson } from './lib/triggers/new-person';
import { newSection } from './lib/triggers/new-section';
import { newComment } from './lib/triggers/new-comment';
import { newTaskLabel } from './lib/triggers/new-task-label';
import { newChecklistItem } from './lib/triggers/new-checklist-item';
import { newProject } from './lib/triggers/new-project';
import { newLabel } from './lib/triggers/new-label';
import { newTask } from './lib/triggers/new-task';
import { createProject } from './lib/actions/create-project';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { findTask } from './lib/actions/find-task';
import { createLabel } from './lib/actions/create-label';
import { createTaskLabel } from './lib/actions/create-task-label';
import { createAttachment } from './lib/actions/create-attachment';
import { findAttachment } from './lib/actions/find-attachment';
import { findLabel } from './lib/actions/find-label';
import { findPerson } from './lib/actions/find-person';
import { findOrCreateAttachment } from './lib/actions/find-or-create-attachment';
import { findOrCreateTask } from './lib/actions/find-or-create-task';
import { findOrCreateLabel } from './lib/actions/find-or-create-label';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { MEISTERTASK_API_URL } from './lib/common/common';
import { meistertaskAuth, getAccessToken } from './lib/auth';

export const meistertask = createPiece({
  displayName: 'MeisterTask',
  description: 'Intuitive online task manager for teams, personal productivity, and everything in between.',
  auth: meistertaskAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/meistertask.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['Ani-4x', 'sanket-a11y', 'BountyGrid'],
  actions: [
    createTask,
    updateTask,
    findTask,
    createProject,
    createLabel,
    createTaskLabel,
    createAttachment,
    findAttachment,
    findLabel,
    findPerson,
    findOrCreateAttachment,
    findOrCreateTask,
    findOrCreateLabel,
    createCustomApiCallAction({
      auth: meistertaskAuth,
      baseUrl: () => MEISTERTASK_API_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${getAccessToken(auth)}`,
        };
      },
    }),
  ],
  triggers: [
    taskCreated,
    taskCompleted,
    newTask,
    newAttachment,
    newPerson,
    newSection,
    newComment,
    newTaskLabel,
    newChecklistItem,
    newProject,
    newLabel,
  ],
});
