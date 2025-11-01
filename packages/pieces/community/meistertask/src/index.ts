import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { newAttachment } from './lib/triggers/new-attachment';
// import { newPerson } from './lib/triggers/new-person';
// import { newSection } from './lib/triggers/new-section';
// import { newComment } from './lib/triggers/new-comment';
// import { newTaskLabel } from './lib/triggers/new-task-label';
// import { newChecklistItem } from './lib/triggers/new-checklist-item';
// import { newProject } from './lib/triggers/new-project';
// import { newLabel } from './lib/triggers/new-label';
// import { newTask } from './lib/triggers/new-task';
import { createLabel } from './lib/actions/create-label';
// import { createTaskLabel } from './lib/actions/create-task-label';
// import { createAttachment } from './lib/actions/create-attachment';
// import { createTask } from './lib/actions/create-task';
// import { updateTask } from './lib/actions/update-task';
// import { findAttachment } from './lib/actions/find-attachment';
// import { findLabel } from './lib/actions/find-label';
// import { findPerson } from './lib/actions/find-person';
// import { findTask } from './lib/actions/find-task';
// import { findOrCreateAttachment } from './lib/actions/find-or-create-attachment';
// import { findOrCreateTask } from './lib/actions/find-or-create-task';
// import { findOrCreateLabel } from './lib/actions/find-or-create-label';



export const meistertaskAuth = PieceAuth.OAuth2({
  description: 'Authentication for MeisterTask (uses MindMeister OAuth2)',
  authUrl: 'https://www.mindmeister.com/oauth2/authorize',
  tokenUrl: 'https://www.mindmeister.com/oauth2/token',
  required: true,
  scope: ['userinfo.profile', 'userinfo.email', 'meistertask'],
});


export const meistertask = createPiece({
  displayName: 'MeisterTask',
  description: 'Intuitive online task manager for teams',
  auth: meistertaskAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/meistertask.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['Ani-4x'],
  actions: [
    createLabel,
    // createTaskLabel,
    // createAttachment,
    // createTask,
    // updateTask,
    // findAttachment,
    // findLabel,
    // findPerson,
    // findTask,
    // findOrCreateAttachment,
    // findOrCreateTask,
    // findOrCreateLabel,
  ],
  triggers: [
    newAttachment,
    // newPerson,
    // newSection,
    // newComment,
    // newTaskLabel,
    // newChecklistItem,
    // newProject,
    // newLabel,
    // newTask,
  ],
});