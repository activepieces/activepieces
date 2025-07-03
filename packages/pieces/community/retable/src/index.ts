import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { retableCreateProjectAction } from './lib/actions/create-project';
import { retableCreateWorkspaceAction } from './lib/actions/create-workspace';
import { retableGetAllProjectsAction } from './lib/actions/get-all-projects';
import { retableGetAllRetablesAction } from './lib/actions/get-all-retables';
import { retableGetAllWorkspacesAction } from './lib/actions/get-all-workspaces';
import { retableCreateRecordAction } from './lib/actions/insert-record';
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
  minimumSupportedRelease: '0.30.0',
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
    createCustomApiCallAction({
      baseUrl: () => retableCommon.baseUrl,
      auth: retableAuth,
      authMapping: async (auth) => ({
        ApiKey: auth as string,
      }),
    }),
  ],
  triggers: [],
});
