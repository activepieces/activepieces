import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createInvoiceAction } from './lib/actions/create-invoice.action';
import { PieceCategory } from '@activepieces/shared';
import { findProductRatePlanAction } from './lib/actions/find-product-rate-plans.action';
import { findAccountAction } from './lib/actions/find-account.action';
import { findProductAction } from './lib/actions/find-product.action';

export const zuoraAuth = PieceAuth.CustomAuth({
  description: `
  - **Establish a Dedicated API User** : Zuora recommends creating a distinct API user specifically for OAuth authentication with write permissions. Refer to the [API User Creation Guide](https://knowledgecenter.zuora.com/Zuora_Central_Platform/Tenant_Management/A_Administrator_Settings/Manage_Users/Create_an_API_User) for detailed instructions on setting up this user.
  - **Create OAuth Client** : After setting up the API user, it's essential to create an OAuth client tailored for this user.Detailed instructions can be found in the [OAuth Client Creation Guide](https://knowledgecenter.zuora.com/Zuora_Central_Platform/Tenant_Management/A_Administrator_Settings/Manage_Users).
  - **Refer to Base API URL** : Utilize the [Base API URL](https://developer.zuora.com/v1-api-reference/introduction/#section/Introduction/Access-to-the-API) provided by Zuora for your environment. This URL serves as the entry point for accessing the Zuora API.`,
  required: true,
  props: {
    clientId: Property.ShortText({
      displayName: 'Client ID',
      required: true,
    }),
    clientSecret: Property.ShortText({
      displayName: 'Client Secret',
      required: true,
    }),
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'US Cloud 1 Production',
            value: 'https://rest.na.zuora.com',
          },
          {
            label: 'US Cloud 1 API Sandbox',
            value: 'https://rest.sandbox.na.zuora.com',
          },
          {
            label: 'US Cloud 2 Production',
            value: 'https://rest.zuora.com',
          },
          {
            label: 'US Cloud 2 API Sandbox',
            value: 'https://rest.apisandbox.zuora.com',
          },
          {
            label: 'US Central Sandbox',
            value: 'https://rest.test.zuora.com',
          },
          {
            label: 'EU Production',
            value: 'https://rest.eu.zuora.com',
          },
          {
            label: 'EU API Sandbox',
            value: 'https://rest.sandbox.eu.zuora.com',
          },
          {
            label: 'EU Developer & Central Sandbox',
            value: 'https://rest.test.eu.zuora.com',
          },
        ],
      },
    }),
  },
});

export const zuora = createPiece({
  displayName: 'Zuora',
  auth: zuoraAuth,
  minimumSupportedRelease: '0.27.1',
  description:
    'Cloud-based subscription management platform that enables businesses to launch and monetize subscription services.',
  logoUrl: 'https://cdn.activepieces.com/pieces/zuora.png',
  categories: [
    PieceCategory.SALES_AND_CRM,
    PieceCategory.PAYMENT_PROCESSING,
  ],
  authors: ['kishanprmr'],
  actions: [
    createInvoiceAction,
    findAccountAction,
    findProductRatePlanAction,
    findProductAction,
  ],
  triggers: [],
});
