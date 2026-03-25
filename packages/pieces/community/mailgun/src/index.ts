import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { mailgunAuth } from './lib/auth';
import { addListMemberAction } from './lib/actions/add-list-member';
import { createDomainAction } from './lib/actions/create-domain';
import { createMailingListAction } from './lib/actions/create-mailing-list';
import { getEventsAction } from './lib/actions/get-events';
import { getMessageAction } from './lib/actions/get-message';
import { sendEmailAction } from './lib/actions/send-email';

export const mailgun = createPiece({
  displayName: 'Mailgun',
  description: 'Email delivery, mailing lists, and domain management with Mailgun.',
  auth: mailgunAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://www.mailgun.com/favicon.ico',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.MARKETING],
  authors: ['Harmatta'],
  actions: [
    sendEmailAction,
    getMessageAction,
    createMailingListAction,
    addListMemberAction,
    createDomainAction,
    getEventsAction,
  ],
  triggers: [],
});
