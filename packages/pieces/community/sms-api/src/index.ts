import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { createContact } from './lib/actions/create-contact';
import { sendTextMessage } from './lib/actions/send-text-message';
import { sendTextMessageToGroup } from './lib/actions/send-text-message-to-group';
import { deleteContact } from './lib/actions/delete-contact';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { SMSAPIAuth } from './lib/common/auth';

export const smsApi = createPiece({
  displayName: 'SMSAPI',
  auth: SMSAPIAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sms-api.png',
  authors: ['sanket-a11y'],
  actions: [
    createContact,
    deleteContact,
    sendTextMessage,
    sendTextMessageToGroup,
    createCustomApiCallAction({
      auth: SMSAPIAuth,
      baseUrl: () => 'https://api.smsapi.com',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [],
});
