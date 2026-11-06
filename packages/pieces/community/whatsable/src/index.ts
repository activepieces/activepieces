import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendMessage } from './lib/actions/send-message';

export const whatsableAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to your WhatsAble dashboard.
2. Open **API keys** in the sidebar.
3. Select **Reveal** on a key, or **Create API key**, and copy it.

You need a Pro or Agency plan and a connected WhatsApp number.`,
  required: true,
});

export const whatsable = createPiece({
  displayName: 'Whatsable',
  description: 'Send WhatsApp messages from your WhatsAble account',
  auth: whatsableAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/whatsable.png',
  authors: ["abuaboud"],
  actions: [sendMessage],
  triggers: [],
});
