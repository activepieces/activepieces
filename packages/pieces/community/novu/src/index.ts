import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
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
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.novu.co/v1/subscribers?limit=1',
        headers: {
          Authorization: `ApiKey ${auth}`,
        },
      });
      return { valid: true };
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } }).response?.status;
      return {
        valid: false,
        error: status
          ? `Authentication failed (HTTP ${status}). Check your API key.`
          : 'Could not reach the Novu API. Please try again later.',
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
