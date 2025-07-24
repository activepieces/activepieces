import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Import actions
import { createItemAction } from './lib/actions/create-item';
import { updateItemAction } from './lib/actions/update-item';
import { findItemAction } from './lib/actions/find-item';
import { createTaskAction } from './lib/actions/create-task';
import { updateTaskAction } from './lib/actions/update-task';
import { findTaskAction } from './lib/actions/find-task';
import { attachFileAction } from './lib/actions/attach-file';
import { createCommentAction } from './lib/actions/create-comment';
import { createStatusUpdateAction } from './lib/actions/create-status-update';

// Import triggers
import { newItemTrigger } from './lib/triggers/new-item';
import { newTaskTrigger } from './lib/triggers/new-task';
import { newActivityTrigger } from './lib/triggers/new-activity';
import { itemUpdatedTrigger } from './lib/triggers/item-updated';
import { newOrganizationTrigger } from './lib/triggers/new-organization';
import { newWorkspaceTrigger } from './lib/triggers/new-workspace';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';

const markdownDescription = `
To use Podio, you need to set up OAuth2 authentication:

1. Log in to your Podio Developer account at https://developers.podio.com/
2. Create a new App by clicking "Create new app"
3. Fill in the app details and set the redirect URL to match your integration
4. Copy the Client ID and Client Secret
5. Use the OAuth2 flow to get an access token for API calls

For more information, visit: https://developers.podio.com/authentication
`;

export const podioAuth = PieceAuth.OAuth2({
  description: markdownDescription,
  authUrl: 'https://podio.com/oauth/authorize',
  tokenUrl: 'https://api.podio.com/oauth/token',
  required: true,
  scope: ['read', 'write', 'delete']
});

export const podio = createPiece({
  displayName: 'Podio',
  description: 'Podio is a collaborative work platform that helps teams organize work the way they want.',
  auth: podioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/podio.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['activepieces'],
  actions: [
    createItemAction,
    updateItemAction,
    findItemAction,
    createTaskAction,
    updateTaskAction,
    findTaskAction,
    attachFileAction,
    createCommentAction,
    createStatusUpdateAction,
    createCustomApiCallAction({
      auth: podioAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `OAuth2 ${(auth as any).access_token}`,
        };
      },
    }),
  ],
  triggers: [
    newItemTrigger,
    newTaskTrigger,
    newActivityTrigger,
    itemUpdatedTrigger,
    newOrganizationTrigger,
    newWorkspaceTrigger,
  ],
});