import { createPiece } from '@activepieces/pieces-framework';
import { kudosityAuth } from './lib/common/auth';
import { addUpdateContact } from './lib/actions/add-update-contact';
import { deleteContact } from './lib/actions/delete-contact';
import { cancelSms } from './lib/actions/cancel-sms';
import { formatNumber } from './lib/actions/format-number';
import { sendSms } from './lib/actions/send-sms';
import { getSmsInfo } from './lib/actions/get-sms-info';

export const kudosity = createPiece({
  displayName: 'Kudosity',
  auth: kudosityAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/kudosity.png',
  authors: ['sanket-a11y'],
  actions: [addUpdateContact, deleteContact, cancelSms, formatNumber, sendSms, getSmsInfo],
  triggers: [],
});
