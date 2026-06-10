import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { knockAuth, KNOCK_API_BASE_URL, knockHeaders } from './lib/auth';
import { triggerWorkflow } from './lib/actions/trigger-workflow';
import { identifyUser } from './lib/actions/identify-user';
import { getUser } from './lib/actions/get-user';
import { deleteUser } from './lib/actions/delete-user';
import { getMessage } from './lib/actions/get-message';
import { listMessages } from './lib/actions/list-messages';

export const knock = createPiece({
  displayName: 'Knock',
  description:
    'Notification infrastructure for developers. Manage users, trigger workflows, and track messages.',
  auth: knockAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/knock.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['Harmatta'],
  actions: [
    triggerWorkflow,
    identifyUser,
    getUser,
    deleteUser,
    getMessage,
    listMessages,
    createCustomApiCallAction({
      baseUrl: () => KNOCK_API_BASE_URL,
      auth: knockAuth,
      authMapping: async (auth) => knockHeaders(auth.secret_text),
    }),
  ],
  triggers: [],
});
