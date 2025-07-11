import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { clicksendSendSms } from './lib/action/send-sms';
import { clicksendSendMms } from './lib/action/send-mms';
import { clicksendCreateContact } from './lib/action/create-contact';
import { clicksendUpdateContact } from './lib/action/update-contact';
import { clicksendDeleteContact } from './lib/action/delete-contact';
import { clicksendCreateContactList } from './lib/action/create-contact-list';
import { clicksendSearchContactByEmail } from './lib/action/search-contact-by-email';
import { clicksendSearchContactByPhone } from './lib/action/search-contact-by-phone';
import { clicksendSearchContactLists } from './lib/action/search-contact-lists';
import { clicksendNewIncomingSms } from './lib/trigger/new-incoming-sms';

export const clicksendAuth = PieceAuth.BasicAuth({
  description: 'The authentication to use to connect to ClickSend',
  required: true,
  username: {
    displayName: 'Username',
    description: 'Your ClickSend username',
  },
  password: {
    displayName: 'API Key',
    description: 'Your ClickSend API key',
  },
});

export const clicksend = createPiece({
  displayName: 'ClickSend',
  description: 'Cloud-based messaging platform for sending SMS, MMS, voice, email, and more',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/clicksend.png',
  auth: clicksendAuth,
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    clicksendSendSms,
    clicksendSendMms,
    clicksendCreateContact,
    clicksendUpdateContact,
    clicksendDeleteContact,
    clicksendCreateContactList,
    clicksendSearchContactByEmail,
    clicksendSearchContactByPhone,
    clicksendSearchContactLists,
    createCustomApiCallAction({
      baseUrl: () => 'https://rest.clicksend.com/v3',
      auth: clicksendAuth,
      authMapping: async (auth) => ({
        Authorization: `Basic ${Buffer.from(
          `${(auth as { username: string }).username}:${
            (auth as { password: string }).password
          }`
        ).toString('base64')}`,
      }),
    }),
  ],
  authors: ["sparkybug"],
  triggers: [clicksendNewIncomingSms],
}); 