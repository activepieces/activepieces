import { HttpMethod } from '@activepieces/pieces-common';
import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { apiRequest } from './lib/common';
import { sendText } from './lib/actions/send-text';
import { sendImage } from './lib/actions/send-image';
import { sendFile } from './lib/actions/send-file';

export const retentionStackAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Sign in at https://whatsapp-messaging.retentionstack.agency/start, link your number, and copy a session token (ch_live_...) or account key (ak_live_...) from the console.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await apiRequest(auth, HttpMethod.GET, '/v1/sessions');
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key.' };
    }
  },
});

export const whatsappRetentionStack = createPiece({
  displayName: 'WhatsApp by Retention Stack',
  description: 'Send WhatsApp messages from a number linked by QR code. No WhatsApp Business account needed.',
  auth: retentionStackAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/whatsapp-retention-stack.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['jevil25'],
  actions: [sendText, sendImage, sendFile],
  triggers: [],
});
