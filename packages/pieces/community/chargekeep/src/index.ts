import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addOrUpdateContactExtended } from './lib/actions/add-or-update-contact-extended';
import { addOrUpdateContact } from './lib/actions/add-or-update-contact';
import { addOrUpdateSubscription } from './lib/actions/add-or-update-subscription';
import { createInvoice } from './lib/actions/create-invoice';
import { getLead } from './lib/triggers/get-lead';
import { newPayment } from './lib/triggers/new-payment';
import { newSubscription } from './lib/triggers/new-subscription';

const markdownDescription = `
  Follow these instructions to get your Chargekeep API Key:

  1. Visit the following website: https://beta.chargekeep.com/
  2. Once on the website, locate and click on the admin to obtain your chargekeep API Key.
`;

export const chargekeepAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
});

export const chargekeep = createPiece({
  displayName: 'ChargeKeep (Beta)',
  description: 'ChargeKeep Beta API',
  auth: chargekeepAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl:
    'https://zapier-images.imgix.net/storage/developer_cli/a981561431e555e4d5e355d3546f368e.png?auto=format&fit=crop&ixlib=react-9.8.1&q=50&w=20&h=20&dpr=1',
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  authors: [],
  actions: [
    addOrUpdateContact,
    addOrUpdateContactExtended,
    addOrUpdateSubscription,
    createInvoice,
  ],
  triggers: [getLead, newPayment, newSubscription],
});
