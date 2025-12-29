import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { heymarketSmsAuth } from './lib/common/auth';
import { chatStarted } from './lib/triggers/chat-started';
import { contactUnsubscribe } from './lib/triggers/contact-unsubscribe';
import { incommingMessage } from './lib/triggers/incomming-message';
import { outgoingMessage } from './lib/triggers/outgoing-message';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { sendCustomMessage } from './lib/actions/send-custom-message';
import { sendTemplateMessage } from './lib/actions/send-template-message';
import { updateList } from './lib/actions/update-list';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const heymarketSms = createPiece({
  displayName: 'Heymarket-sms',
  auth: heymarketSmsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/heymarket-sms.png',
  authors: ['sanket-a11y'],
  description:
    'Heymarket is a business texting platform that gives you the power to engage with people using shared inboxes. ',
  categories: [PieceCategory.COMMERCE],
  actions: [
    createOrUpdateContact,
    sendCustomMessage,
    sendTemplateMessage,
    updateList,
    createCustomApiCallAction({
      auth: heymarketSmsAuth,
      baseUrl: () => 'https://api.heymarket.com',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  triggers: [
    chatStarted,
    contactUnsubscribe,
    incommingMessage,
    outgoingMessage,
  ],
});
