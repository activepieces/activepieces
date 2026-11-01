import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { suprsendAuth, SUPRSEND_API_BASE_URL, suprsendHeaders } from './lib/auth';
import { triggerWorkflow } from './lib/actions/trigger-workflow';
import { upsertUser } from './lib/actions/upsert-user';
import { updatePreference } from './lib/actions/update-preference';
import { addUserToList } from './lib/actions/add-user-to-list';

export const suprsend = createPiece({
  displayName: 'SuprSend',
  description:
    'Notification infrastructure for email, SMS, push, in-app inbox, WhatsApp and Slack. Trigger workflows and manage users, preferences and lists.',
  auth: suprsendAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/suprsend.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['ADHESHsuryatej'],
  actions: [
    triggerWorkflow,
    upsertUser,
    updatePreference,
    addUserToList,
    createCustomApiCallAction({
      baseUrl: () => SUPRSEND_API_BASE_URL,
      auth: suprsendAuth,
      authMapping: async (auth) => suprsendHeaders(auth.secret_text),
    }),
  ],
  triggers: [],
});
