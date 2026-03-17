import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Triggers
import { quickbooksNewCustomer } from './lib/triggers/new-customer';
import { quickbooksNewInvoice } from './lib/triggers/new-invoice';
import { quickbooksPaymentReceived } from './lib/triggers/payment-received';

// Actions
import { quickbooksCreateCustomer } from './lib/actions/create-customer';
import { quickbooksCreateInvoice } from './lib/actions/create-invoice';
import { quickbooksCreatePayment } from './lib/actions/create-payment';
import { quickbooksGetCustomer } from './lib/actions/get-customer';
import { quickbooksGetInvoice } from './lib/actions/get-invoice';
import { quickbooksFindCustomer } from './lib/actions/find-customer';
import { quickbooksFindInvoice } from './lib/actions/find-invoice';

export const quickbooksAuth = PieceAuth.OAuth2({
  description: `
## Setting Up QuickBooks OAuth2

1. Go to the [Intuit Developer Portal](https://developer.intuit.com/app/developer/homepage).
2. Sign in and click **Create an App**.
3. Choose **QuickBooks Online and Payments** as your platform.
4. Set the **Redirect URI** to the OAuth2 callback URL provided by Activepieces.
5. Copy your **Client ID** and **Client Secret**.

**Required Scopes:**
- \`com.intuit.quickbooks.accounting\` — access to accounting data (customers, invoices, payments)

> **Note:** QuickBooks uses separate sandbox and production environments.  
> For testing, use the sandbox base URL: \`https://sandbox-quickbooks.api.intuit.com\`  
> For production use: \`https://quickbooks.api.intuit.com\`
  `,
  authUrl: 'https://appcenter.intuit.com/connect/oauth2',
  tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  required: true,
  scope: ['com.intuit.quickbooks.accounting', 'openid', 'profile', 'email', 'phone', 'address'],
});

export const quickbooks = createPiece({
  displayName: 'QuickBooks',
  description: 'Accounting and business management software by Intuit for invoices, expenses, payroll, and cash flow',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/quickbooks.png',
  authors: ['bossco'],
  categories: [PieceCategory.ACCOUNTING],
  auth: quickbooksAuth,
  actions: [
    quickbooksCreateCustomer,
    quickbooksCreateInvoice,
    quickbooksCreatePayment,
    quickbooksGetCustomer,
    quickbooksGetInvoice,
    quickbooksFindCustomer,
    quickbooksFindInvoice,
    createCustomApiCallAction({
      baseUrl: () => 'https://quickbooks.api.intuit.com/v3',
      auth: quickbooksAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    quickbooksNewCustomer,
    quickbooksNewInvoice,
    quickbooksPaymentReceived,
  ],
});
