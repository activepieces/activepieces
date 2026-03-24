import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { triggerEvent } from './lib/actions/trigger-event';
import { createSubscriber } from './lib/actions/create-subscriber';
import { updateSubscriber } from './lib/actions/update-subscriber';
import { deleteSubscriber } from './lib/actions/delete-subscriber';

export const novuAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Novu API key. Found in Settings → API Keys in the Novu dashboard.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch(
        'https://api.novu.co/v1/subscribers?limit=1',
        {
          method: 'GET',
          headers: {
            Authorization: `ApiKey ${auth}`,
          },
        }
      );
      if (response.ok) {
        return { valid: true };
      }
      return {
        valid: false,
        error: `Authentication failed (HTTP ${response.status}). Check your API key.`,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Could not reach the Novu API. Please try again later.',
      };
    }
  },
});

export const novu = createPiece({
  displayName: 'Novu',
  description:
    'Open-source notification infrastructure for developers. Manage multi-channel notifications (email, SMS, push, in-app, chat) from a single API.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/novu.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.DEVELOPER_TOOLS],
  authors: ['Harmatta'],
  auth: novuAuth,
  actions: [
    triggerEvent,
    createSubscriber,
    updateSubscriber,
    deleteSubscriber,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.novu.co',
      auth: novuAuth,
      authMapping: async (auth) => ({
        Authorization: `ApiKey ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
