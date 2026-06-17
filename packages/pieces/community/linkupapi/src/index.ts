import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { linkupAuth } from './lib/common';
// actions
import { listAccounts } from './lib/actions/list-accounts';
import { getAccount } from './lib/actions/get-account';
import { getMyProfile } from './lib/actions/get-my-profile';
import { getProfile } from './lib/actions/get-profile';
import { searchPeople } from './lib/actions/search-people';
import { searchCompanies } from './lib/actions/search-companies';
import { getCompany } from './lib/actions/get-company';
import { sendMessage } from './lib/actions/send-message';
import { getConversation } from './lib/actions/get-conversation';
import { sendConnectionRequest } from './lib/actions/send-connection-request';
import { checkInvitationStatus } from './lib/actions/check-invitation-status';
// triggers
import { newMessageReceived } from './lib/triggers/new-message-received';
import { invitationAccepted } from './lib/triggers/invitation-accepted';

export const linkupapi = createPiece({
  displayName: 'LinkupAPI for LinkedIn',
  description:
    'Connect your AI agent to LinkedIn, WhatsApp, and email through one unified API. LinkupAPI lets agents send messages, manage conversations, and automate outreach across every channel, for sales and recruitment.',
  auth: linkupAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://pub-fd0d8aa927e9482997ee57dab0ca223f.r2.dev/logo1.svg',
  categories: [
    PieceCategory.SALES_AND_CRM,
    PieceCategory.MARKETING,
  ],
  authors: ['titouanprx'],
  actions: [
    listAccounts,
    getAccount,
    getMyProfile,
    getProfile,
    searchPeople,
    searchCompanies,
    getCompany,
    sendMessage,
    getConversation,
    sendConnectionRequest,
    checkInvitationStatus,
  ],
  triggers: [newMessageReceived, invitationAccepted],
});
