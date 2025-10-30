import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { meisterTaskAuth } from './lib/common/auth';
import { createTaskAction } from './lib/actions/create-task';
import { createLabelAction } from './lib/actions/create-label';
import { createTaskLabelAction } from './lib/actions/create-task-label';
import { createAttachmentAction } from './lib/actions/create-attachment';
import { updateTaskAction } from './lib/actions/update-task';
import { findAttachmentAction } from './lib/actions/find-attachment';
import { findLabelAction } from './lib/actions/find-label';
import { findPersonAction } from './lib/actions/find-person';
import { findTaskAction } from './lib/actions/find-task';
import { findOrCreateAttachmentAction } from './lib/actions/find-or-create-attachment';
import { findOrCreateTaskAction } from './lib/actions/find-or-create-task';
import { findOrCreateLabelAction } from './lib/actions/find-or-create-label';
import { newTaskTrigger } from './lib/triggers/new-task';
import { newAttachmentTrigger } from './lib/triggers/new-attachment';
import { newPersonTrigger } from './lib/triggers/new-person';
import { newSectionTrigger } from './lib/triggers/new-section';
import { newCommentTrigger } from './lib/triggers/new-comment';
import { newTaskLabelTrigger } from './lib/triggers/new-task-label';
import { newChecklistItemTrigger } from './lib/triggers/new-checklist-item';
import { newProjectTrigger } from './lib/triggers/new-project';
import { newLabelTrigger } from './lib/triggers/new-label';

export const meistertask = createPiece({
  displayName: 'MeisterTask',
  description: 'MeisterTask is an intuitive online task manager that helps teams stay organized and productive through smart integrations and task automations',
  auth: meisterTaskAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/meistertask.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['owuzo'],
  actions: [
    createTaskAction,
    createLabelAction,
    createTaskLabelAction,
    createAttachmentAction,
    updateTaskAction,
    findAttachmentAction,
    findLabelAction,
    findPersonAction,
    findTaskAction,
    findOrCreateAttachmentAction,
    findOrCreateTaskAction,
    findOrCreateLabelAction,
    createCustomApiCallAction({
      auth: meisterTaskAuth,
      baseUrl: () => 'https://www.meistertask.com/api',
      authMapping: async (auth: any) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [
    newTaskTrigger,
    newAttachmentTrigger,
    newPersonTrigger,
    newSectionTrigger,
    newCommentTrigger,
    newTaskLabelTrigger,
    newChecklistItemTrigger,
    newProjectTrigger,
    newLabelTrigger,
  ],
});