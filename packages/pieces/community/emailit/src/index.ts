import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { addSubscriberAction, addSubscriberByIdAction } from './lib/actions/add-subscriber';
import { addSuppressionAction } from './lib/actions/add-suppression';
import { cancelEmailAction } from './lib/actions/cancel-email';
import { findContactAction } from './lib/actions/find-contact';
import { forwardEmailAction } from './lib/actions/forward-email';
import { getDomainAction, getDomainByIdAction } from './lib/actions/get-domain';
import { getEmailAction } from './lib/actions/get-email';
import { listAudiencesAction } from './lib/actions/list-audiences';
import { listDomainsAction } from './lib/actions/list-domains';
import { listEmailsAction } from './lib/actions/list-emails';
import { listTemplatesAction } from './lib/actions/list-templates';
import { removeSubscriberAction, removeSubscriberByIdAction } from './lib/actions/remove-subscriber';
import { removeSuppressionAction } from './lib/actions/remove-suppression';
import { rescheduleEmailAction } from './lib/actions/reschedule-email';
import { retryEmailAction } from './lib/actions/retry-email';
import { sendEmailAction } from './lib/actions/send-email';
import { sendEmailAiAction } from './lib/actions/send-email-ai';
import { updateSubscriberAction, updateSubscriberByIdAction } from './lib/actions/update-subscriber';
import { upsertContactAction, upsertContactByIdAction } from './lib/actions/upsert-contact';
import { verifyDomainAction, verifyDomainByIdAction } from './lib/actions/verify-domain';
import { verifyEmailAddressAction } from './lib/actions/verify-email-address';
import { emailitAuth } from './lib/auth';
import { EMAILIT_API_BASE, emailitClient } from './lib/common/client';

export const emailit = createPiece({
  displayName: 'Emailit',
  description: 'Send transactional emails with Emailit',
  logoUrl: 'https://cdn.activepieces.com/pieces/emailit.svg',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.PRODUCTIVITY],
  minimumSupportedRelease: '0.88.2',
  authors: ['dennisklappe', 'onyedikachi-david'],
  auth: emailitAuth,
  actions: [
    sendEmailAction,
    sendEmailAiAction,
    getEmailAction,
    listEmailsAction,
    rescheduleEmailAction,
    cancelEmailAction,
    retryEmailAction,
    forwardEmailAction,
    listDomainsAction,
    getDomainAction,
    getDomainByIdAction,
    verifyDomainAction,
    verifyDomainByIdAction,
    listAudiencesAction,
    addSubscriberAction,
    addSubscriberByIdAction,
    updateSubscriberAction,
    updateSubscriberByIdAction,
    removeSubscriberAction,
    removeSubscriberByIdAction,
    findContactAction,
    upsertContactAction,
    upsertContactByIdAction,
    addSuppressionAction,
    removeSuppressionAction,
    verifyEmailAddressAction,
    listTemplatesAction,
    createCustomApiCallAction({
      baseUrl: () => EMAILIT_API_BASE,
      auth: emailitAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${emailitClient.apiKeyOf(auth)}`,
      }),
    }),
  ],
  triggers: [],
});
