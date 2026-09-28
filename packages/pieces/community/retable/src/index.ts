import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { retableCreateProjectAction } from './lib/actions/create-project';
import { retableCreateWorkspaceAction } from './lib/actions/create-workspace';
import { retableGetAllProjectsAction } from './lib/actions/get-all-projects';
import { retableGetAllRetablesAction } from './lib/actions/get-all-retables';
import { retableGetAllWorkspacesAction } from './lib/actions/get-all-workspaces';
import { retableCreateRecordAction } from './lib/actions/insert-record';
import { retableInsertRowsAction } from './lib/actions/insert-rows';
import { retableGetRowsAction } from './lib/actions/get-rows';
import { retableSearchRowsAction } from './lib/actions/search-rows';
import { retableUpdateRowsAction } from './lib/actions/update-rows';
import { retableDeleteRowsAction } from './lib/actions/delete-rows';
import { retableAddColumnsAction } from './lib/actions/add-columns';
import { retableDeleteColumnsAction } from './lib/actions/delete-columns';
import { retableGetTableAction } from './lib/actions/get-table';
import { retableCreateTableAction } from './lib/actions/create-table';
import { retableGetWorkspaceAction } from './lib/actions/get-workspace';
import { retableGetProjectAction } from './lib/actions/get-project';
import { retableUploadFileAction } from './lib/actions/upload-file';
import { retableCommon } from './lib/common';
const markdown = `
To obtain your API key, follow these steps:

1. Go to Account Overview by clicking your profile-pic (top-right).
2. Go to API section and enable API key.
3. Copy API key.`;

export const retableAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdown,
  validate: async ({ auth }) => {
    if (auth.startsWith('RTBLv1-')) {
      return {
        valid: true,
      };
    }
    return {
      valid: false,
      error: 'Invalid API Key',
    };
  },
});
export const retable = createPiece({
  displayName: 'Retable',
  description: 'Turn your spreadsheets into smart database apps',

  auth: retableAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/retable.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    retableCreateRecordAction,
    retableGetAllWorkspacesAction,
    retableGetAllProjectsAction,
    retableGetAllRetablesAction,
    retableCreateWorkspaceAction,
    retableCreateProjectAction,
    retableInsertRowsAction,
    retableGetRowsAction,
    retableSearchRowsAction,
    retableUpdateRowsAction,
    retableDeleteRowsAction,
    retableAddColumnsAction,
    retableDeleteColumnsAction,
    retableGetTableAction,
    retableCreateTableAction,
    retableGetWorkspaceAction,
    retableGetProjectAction,
    retableUploadFileAction,
    createCustomApiCallAction({
      baseUrl: () => retableCommon.baseUrl,
      auth: retableAuth,
      authMapping: async (auth) => ({
        ApiKey: auth.secret_text,
      }), 
    }),
  ],
  triggers: [],
});
