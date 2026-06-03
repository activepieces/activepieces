import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { useinboxAuth } from './lib/common/auth';
import { useinboxClient } from './lib/common/client';
import { addContactToListAction } from './lib/actions/add-contact-to-list';
import { createContactListAction } from './lib/actions/create-contact-list';
import { updateContactAction } from './lib/actions/update-contact';
import { unsubscribeContactAction } from './lib/actions/unsubscribe-contact';
import { createCampaignAction } from './lib/actions/create-campaign';
import { sendTransactionalEmailAction } from './lib/actions/send-transactional-email';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newCampaignTrigger } from './lib/triggers/new-campaign';
import { emailBouncedTrigger } from './lib/triggers/email-bounced';
import { emailSpamReportedTrigger } from './lib/triggers/email-spam-reported';
import { emailOpenedTrigger } from './lib/triggers/email-opened';
import { emailClickedTrigger } from './lib/triggers/email-clicked';

export const useinbox = createPiece({
  displayName: 'Inbox',
  description:
    'Email marketing and transactional email automation with INBOX (useinbox.com). Manage contacts, lists, campaigns, and react to delivery events.',
  auth: useinboxAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/useinbox.png',
  categories: [PieceCategory.MARKETING, PieceCategory.COMMUNICATION],
  authors: ['sanket-a11y'],
  actions: [
    addContactToListAction,
    createContactListAction,
    updateContactAction,
    unsubscribeContactAction,
    createCampaignAction,
    sendTransactionalEmailAction,
    createCustomApiCallAction({
      baseUrl: () => useinboxClient.ACCOUNT_BASE_URL,
      auth: useinboxAuth,
      authMapping: async (auth) => {
        const credentials = auth as { username: string; password: string };
        const token = await useinboxClient.fetchAccessToken({
          email: credentials.username,
          password: credentials.password,
        });
        return {
          Authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
  triggers: [
    newContactTrigger,
    newCampaignTrigger,
    emailBouncedTrigger,
    emailSpamReportedTrigger,
    emailOpenedTrigger,
    emailClickedTrigger,
  ],
});

export { useinboxAuth };
