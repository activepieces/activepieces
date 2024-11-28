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
  Follow these instructions to get your Upgrade.chat API Key:

  1. Visit the following website: https://crm.upgrade.chat/ or the beta website: https://betacrm.upgrade.chat/
  2. Once on the website, locate and click on the admin to obtain your Upgrade.chat API Key.
`;

export const upgradechatAuth = PieceAuth.CustomAuth({
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
            label: 'Upgrade.chat Live (crm.upgrade.chat)',
            value: 'https://crm.upgrade.chat/',
          },
          {
            label: 'Upgrade.chat Beta (betacrm.upgrade.chat)',
            value: 'https://betacrm.upgrade.chat/',
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

export const upgradechat = createPiece({
  displayName: 'Upgrade.chat',
  description:
    'Supercharge your Discord or Telegram communities with subscription payments and membership tools.',
  auth: upgradechatAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/upgradechat.png',
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
