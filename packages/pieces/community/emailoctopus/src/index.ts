import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addOrUpdateContactAction } from './lib/actions/add-or-update-contact';
import { addTagToContactAction } from './lib/actions/add-tag-to-contact';
import { createListAction } from './lib/actions/create-list';
import { findContactAction } from './lib/actions/find-contact';
import { removeTagFromContactAction } from './lib/actions/remove-tag-from-contact';
import { unsubscribeContactAction } from './lib/actions/unsubscribe-contact';
import { updateContactEmailAction } from './lib/actions/update-contact-email';
import { emailOctopusAiActions } from './lib/actions/ai';
import { emailOctopusAuth } from './lib/auth';
import { emailOctopusClient } from './lib/common/client';
import { contactUnsubscribesTrigger } from './lib/triggers/contact-unsubscribes';
import { emailBouncedTrigger } from './lib/triggers/email-bounced';
import { emailClickedTrigger } from './lib/triggers/email-clicked';
import { emailOpenedTrigger } from './lib/triggers/email-opened';
import { newContactTrigger } from './lib/triggers/new-contact';

export const emailoctopus = createPiece({
  displayName: 'EmailOctopus',
  description:
    'Email marketing platform for list management, campaign sending, tagging & unsubscribes. Automate contact management and campaign engagement tracking.',
  auth: emailOctopusAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/emailoctopus.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Pranith124'],
  actions: [
    addOrUpdateContactAction,
    unsubscribeContactAction,
    updateContactEmailAction,
    addTagToContactAction,
    removeTagFromContactAction,
    createListAction,
    findContactAction,
    ...emailOctopusAiActions,
    createCustomApiCallAction({
      auth: emailOctopusAuth,
      baseUrl: () => emailOctopusClient.baseUrl(),
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    emailBouncedTrigger,
    emailOpenedTrigger,
    emailClickedTrigger,
    newContactTrigger,
    contactUnsubscribesTrigger,
  ],
});
