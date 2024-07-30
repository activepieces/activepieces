import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addOrUpdateContactExtended } from './lib/actions/add-or-update-contact-extended';
import { addOrUpdateContact } from './lib/actions/add-or-update-contact';
import { addOrUpdateSubscription } from './lib/actions/add-or-update-subscription';
import { createInvoice } from './lib/actions/create-invoice';
import { newLead } from './lib/triggers/new-lead';
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
  displayName: 'ChargeKeep',
  description: 'Recurring Payments Software',
  auth: chargekeepAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/chargekeep.png',
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  authors: ['Trayshmhirk'],
  actions: [
    addOrUpdateContact,
    addOrUpdateContactExtended,
    addOrUpdateSubscription,
    createInvoice,
  ],
  triggers: [newLead, newPayment, newSubscription],
});
