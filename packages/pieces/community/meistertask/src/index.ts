import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from './lib/common/auth';
import { newAttachment } from './lib/triggers/new-attachment';
import { newComment } from './lib/triggers/new-comment';
import { newPerson } from './lib/triggers/new-person';
import { newSection } from './lib/triggers/new-section';
import { newTaskLabel } from './lib/triggers/new-task-label';
import { newChecklistItem } from './lib/triggers/new-checklist-item';
import { newLabel } from './lib/triggers/new-label';
import { newProject } from './lib/triggers/new-project';
import { newTask } from './lib/triggers/new-task';
import { createAttachment } from './lib/actions/create-attachment';
import { createLabel } from './lib/actions/create-label';
import { createTaskLabel } from './lib/actions/create-task-label';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { findAttachment } from './lib/actions/find-attachment';
import { findTask } from './lib/actions/find-task';
import { findOrCreateAttachment } from './lib/actions/find-or-create-attachment';
import { findOrCreateTask } from './lib/actions/find-or-create-task';
import { findOrCreateLabel } from './lib/actions/find-or-create-label';
import { findPerson } from './lib/actions/find-person';

export const meistertask = createPiece({
  displayName: 'Meistertask',
  auth: meisterTaskAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/meistertask.png',
  authors: ["gs03-dev"],
  actions: [
    createAttachment,
    createLabel,
    createTaskLabel,
    createTask,
    updateTask,
    findAttachment,
    findTask,
    findOrCreateAttachment,
    findOrCreateTask,
    findOrCreateLabel,
    findPerson
  ],
  triggers: [
    newAttachment,
    newComment,
    newPerson,
    newSection,
    newTaskLabel,
    newChecklistItem,
    newLabel,
    newProject,
    newTask
  ],
});
