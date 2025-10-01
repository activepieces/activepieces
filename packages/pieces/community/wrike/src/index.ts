import { createPiece} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { wrikeAuth } from './lib/common/common';
import { createTaskAction } from './lib/actions/create-task';
import { updateTaskAction } from './lib/actions/update-task';
import { createFolderAction } from './lib/actions/create-folder';
import { createProjectAction } from './lib/actions/create-project';
import { addCommentAction } from './lib/actions/add-comment';
import { uploadAttachmentAction } from './lib/actions/upload-attachment-to-task';
import { findTaskAction } from './lib/actions/find-task';
import { findFolderAction } from './lib/actions/find-folder-or-project';
import { newTaskTrigger } from './lib/triggers/new-task';
import { newFolderTrigger } from './lib/triggers/new-folder';
import { newSubtaskTrigger } from './lib/triggers/new-subtask-created';

export const wrike = createPiece({
  displayName: 'Wrike',
  description: 'Manage and track your work in Wrike',
  auth: wrikeAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/wrike.png',
  authors: ['Ani-4x'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [
    createTaskAction,
    updateTaskAction,
    createFolderAction,
    createProjectAction,
    addCommentAction,
    uploadAttachmentAction,
    findTaskAction,
    findFolderAction,
  ],
  triggers: [
    newTaskTrigger,
    newFolderTrigger,
    newSubtaskTrigger,
  ],
});