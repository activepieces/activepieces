import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { vapiAuth, VAPI_BASE_URL } from './lib/auth';
import { createCall } from './lib/actions/create-call';
import { getCall } from './lib/actions/get-call';
import { updateAssistant } from './lib/actions/update-assistant';

export const vapi = createPiece({
  displayName: 'Vapi',
  description:
    'AI voice agent platform. Create outbound calls, manage assistants, and retrieve call details.',
  auth: vapiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/vapi.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['Harmatta'],
  actions: [
    createCall,
    getCall,
    updateAssistant,
    createCustomApiCallAction({
      baseUrl: () => VAPI_BASE_URL,
      auth: vapiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
