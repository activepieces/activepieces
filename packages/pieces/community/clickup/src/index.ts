import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createClickupTaskComment } from './lib/actions/comments/create-task-comment';
import { getClickupTaskComments } from './lib/actions/comments/get-task-comments';
import { getClickupAccessibleCustomFields } from './lib/actions/custom-fields/get-accessible-custom-fields';
import { setClickupCustomFieldValue } from './lib/actions/custom-fields/set-custom-fields-value';
import { createClickupFolderlessList } from './lib/actions/lists/create-folderless-list';
import { getClickupList } from './lib/actions/lists/get-list';
import { getClickupSpace } from './lib/actions/spaces/get-space';
import { getClickupSpaces } from './lib/actions/spaces/get-spaces';
import { createClickupSubtask } from './lib/actions/tasks/create-subtask';
import { createClickupTask } from './lib/actions/tasks/create-task';
import { createClickupTaskFromTemplate } from './lib/actions/tasks/create-task-from-template';
import { deleteClickupTask } from './lib/actions/tasks/delete-task';
import { filterClickupWorkspaceTasks } from './lib/actions/tasks/filter-workspace-tasks';
import { filterClickupWorkspaceTimeEntries } from './lib/actions/tasks/filter-workspace-time-entries';
import { getClickupTask } from './lib/actions/tasks/get-task';
import { updateClickupTask } from './lib/actions/tasks/update-task';
import { clickupTriggers as triggers } from './lib/triggers';

export const clickupAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://app.clickup.com/api',
  tokenUrl: 'https://app.clickup.com/api/v2/oauth/token',
  required: true,
  scope: [],
});

export const clickup = createPiece({
  displayName: 'ClickUp',
  description: 'All-in-one productivity platform',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/clickup.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: clickupAuth,
  actions: [
    createClickupTask,
    createClickupTaskFromTemplate,
    createClickupFolderlessList,
    createClickupTaskComment,
    createClickupSubtask,
    getClickupList,
    getClickupTask,
    getClickupSpace,
    getClickupSpaces,
    getClickupTaskComments,
    filterClickupWorkspaceTasks,
    filterClickupWorkspaceTimeEntries,
    updateClickupTask,
    deleteClickupTask,
    getClickupAccessibleCustomFields,
    setClickupCustomFieldValue,
    createCustomApiCallAction({
      auth: clickupAuth,
      baseUrl: () => {
        return 'https://api.clickup.com/api/v2/';
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  authors: ["kanarelo","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  triggers,
});
