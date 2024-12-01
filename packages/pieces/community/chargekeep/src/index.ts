import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addOrUpdateContactExtended } from './lib/actions/add-or-update-contact-extended';
import { addOrUpdateContact } from './lib/actions/add-or-update-contact';
import { addOrUpdateSubscription } from './lib/actions/add-or-update-subscription';
import { createInvoice } from './lib/actions/create-invoice';
import { newLead } from './lib/triggers/new-lead';
import { newPayment } from './lib/triggers/new-payment';
import { newSubscription } from './lib/triggers/new-subscription';
import { createProduct } from './lib/actions/create-product';
import { getContactDetails } from './lib/actions/get-contact-details';

const markdownDescription = `
  Follow these instructions to get your Chargekeep API Key:

  1. Visit the following website: https://crm.chargekeep.com/ or the beta website: https://beta.chargekeep.com
  2. Once on the website, locate and click on the admin to obtain your chargekeep API Key.
`;

export const chargekeepAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    base_url: Property.StaticDropdown({
      displayName: 'Base URL',
      description: 'Select the base environment URL',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'ChargeKeep Live (crm.chargekeep.com)',
            value: 'https://crm.chargekeep.com',
          },
          {
            label: 'ChargeKeep Beta (beta.chargekeep.com)',
            value: 'https://beta.chargekeep.com',
          },
        ],
      },
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'Secret API Key',
      description: 'Enter the API Key',
      required: true,
    }),
  },
});

export const chargekeep = createPiece({
  displayName: 'ChargeKeep',
  description: 'Easy-to-use recurring and one-time payments software for Stripe & PayPal',
  auth: chargekeepAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/chargekeep.png',
  categories: [PieceCategory.COMMERCE, PieceCategory.PAYMENT_PROCESSING],
  authors: ['Trayshmhirk'],
  actions: [
    addOrUpdateContact,
    addOrUpdateContactExtended,
    addOrUpdateSubscription,
    createInvoice,
    createProduct,
    getContactDetails,
  ],
  triggers: [newLead, newPayment, newSubscription],
});
