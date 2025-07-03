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
import { createProduct } from './lib/actions/create-product';
import { getContactDetails } from './lib/actions/get-contact-details';
import { newLead } from './lib/triggers/new-lead';
import { newPayment } from './lib/triggers/new-payment';
import { newSubscription } from './lib/triggers/new-subscription';

const markdownDescription = `
  Follow these instructions to get your Sperse API Key:

  1. Visit the following website: https://app.sperse.com/, or the beta website: https://beta.sperse.com, or the test website: https://testadmin.sperse.com 
  2. Once on the website, locate and click on the admin to obtain your sperse API Key.
`;

export const sperseAuth = PieceAuth.CustomAuth({
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
            label: 'Sperse Live (app.sperse.com)',
            value: 'https://app.sperse.com',
          },
          {
            label: 'Sperse Beta (beta.sperse.com)',
            value: 'https://beta.sperse.com',
          },
          {
            label: 'Sperse Test (testadmin.sperse.com)',
            value: 'https://testadmin.sperse.com',
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

export const sperse = createPiece({
  displayName: 'Sperse',
  description:
    'Sperse CRM enables secure payment processing and affiliate marketing for online businesses',
  auth: sperseAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sperse.png',
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
