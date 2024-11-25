import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { addOrUpdateContactExtended } from './lib/actions/add-or-update-contact-extended';
import { addOrUpdateContact } from './lib/actions/add-or-update-contact';
import { addOrUpdateSubscription } from './lib/actions/add-or-update-subscription';
import { createInvoice } from './lib/actions/create-invoice';
import { createProduct } from './lib/actions/create-product';
import { getContactDetails } from './lib/actions/get-contact-details';
import { newLead } from './lib/triggers/new-lead';
import { newPayment } from './lib/triggers/new-payment';
import { newSubscription } from './lib/triggers/new-subscription';
import { PieceCategory } from '@activepieces/shared';

const markdownDescription = `
  Follow these instructions to get your Linka API Key:

  1. Visit the following website: https://crm.linka.ai/ or the beta website: https://beta.linka.ai/
  2. Once on the website, locate and click on the admin to obtain your Linka API Key.
`;

export const linkaAuth = PieceAuth.CustomAuth({
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
            label: 'Linka Live (crm.linka.ai)',
            value: 'https://crm.linka.ai/',
          },
          {
            label: 'Linka Beta (beta.linka.ai)',
            value: 'https://beta.linka.ai/',
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

export const linka = createPiece({
  displayName: 'Linka',
  description:
    'Linka white-label B2B marketplace platform powers communities and digital storefronts',
  auth: linkaAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/linka.png',
  authors: ['Trayshmhirk', 'OmarSayed'],
  categories: [PieceCategory.SALES_AND_CRM],
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
