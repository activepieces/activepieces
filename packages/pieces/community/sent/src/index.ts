import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { sentAuth } from './lib/auth';
import { customApiCall } from './lib/actions/custom-api-call';
import { getAccount } from './lib/actions/get-account';
import { getContact } from './lib/actions/get-contact';
import { getMessageActivities } from './lib/actions/get-message-activities';
import { getMessageStatus } from './lib/actions/get-message-status';
import { getPhoneNumberDetails } from './lib/actions/get-phone-number-details';
import { listContacts } from './lib/actions/list-contacts';
import { sendMessage } from './lib/actions/send-message';
import { newEvent } from './lib/triggers/new-event';
import { newMessageReceived } from './lib/triggers/new-message-received';

export const sent = createPiece({
  displayName: 'Sent',
  description: 'Multi-channel SMS, WhatsApp, and RCS messaging with Sent.',
  minimumSupportedRelease: '0.90.2',
  logoUrl: 'https://www.sent.dm/icons/apple-touch-icon.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: sentAuth,
  authors: ['amari2000'],
  actions: [
    getAccount,
    sendMessage,
    getMessageStatus,
    getMessageActivities,
    listContacts,
    getContact,
    getPhoneNumberDetails,
    customApiCall,
  ],
  triggers: [newEvent, newMessageReceived],
});
