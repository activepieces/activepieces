
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { wrikeAuth } from './lib/common/auth';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { createFolder } from './lib/actions/create-folder';
import { createProject } from './lib/actions/create-project';
import { addComment } from './lib/actions/add-comment';
import { uploadAttachment } from './lib/actions/upload-attachment';
import { findTask } from './lib/actions/find-task';
import { findFolder } from './lib/actions/find-folder';
import { newTask } from './lib/triggers/new-task';
import { newFolder } from './lib/triggers/new-folder';
import { newSubtask } from './lib/triggers/new-subtask';

export const wrike = createPiece({
  displayName: "Wrike",
  auth: wrikeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/wrike.png",
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['owuzo'],
  actions: [
    createTask,
    updateTask,
    createFolder,
    createProject,
    addComment,
    uploadAttachment,
    findTask,
    findFolder,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.wrike.com/api/v4',
      auth: wrikeAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as any).access_token}`,
      }),
    }),
  ],
  triggers: [
    newTask,
    newFolder,
    newSubtask,
  ],
});
    