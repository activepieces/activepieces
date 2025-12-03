
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { createOrder } from "./lib/actions/create-order"
import { createPaymentLink } from "./lib/actions/create-payment-link"
import { createRefund } from "./lib/actions/create-refund"
import { cancelPaymentLink } from "./lib/actions/cancel-payment-link"
import { fetchPaymentLinkDetails } from "./lib/actions/fetch-payment-link-details"
import { createCashgram } from "./lib/actions/create-cashgram"
import { getOrdersForPaymentLink } from "./lib/actions/get-orders-for-payment-link"
import { getAllRefundsForOrder } from "./lib/actions/get-all-refunds-for-order"
import { deactivateCashgram } from "./lib/actions/deactivate-cashgram"


export const cashfreeTriggers = createPiece({
  displayName: "Cashfree Payments",
  description: 'Cashfree Payments integration for processing payments, refunds, and managing payment links and cashgrams.',
  auth: PieceAuth.CustomAuth({
    description: `Connect your Cashfree account

  This connector requires Cashfree API credentials (Client ID and Client Secret). Important: each Cashfree product is a separate product and requires its own credentials. For example, the Payments API and the Payouts API each need their own Client ID / Client Secret pairs.

  Create two connections (recommended)
  - For clarity and security we recommend creating two separate Activepieces connections:
    1. **Payments connection** — use the Payments API Client ID / Client Secret. Use this connection for payments-related actions (create order, payment links, refunds, etc.).
    2. **Payouts connection** — use the Payouts API Client ID / Client Secret. Use this connection for Cashgram and other payouts-related actions.

  Which keys to use
  - Payments API: use the credentials generated for the Payments product.
  - Payouts API (required by Cashgram actions): use credentials generated from the Payouts dashboard.

  How to generate API keys:
  1. Sign in to your Cashfree account and open the *Payouts* dashboard.
  2. In the navigation panel select **Developers**.
  3. Click **API Keys**.
  4. Click **Generate API Keys** on the API Keys screen.
  5. The **New API Keys** popup displays the Client ID and Client Secret.
  6. Click **Download API Keys** to save the keys locally. Keep these secret — do not share them.



`,
    props: {
      // authType: Property.StaticDropdown({
      //   displayName: 'Authentication Type',
      //   description: 'Choose authentication method based on your use case',
      //   required: true,
      //   defaultValue: 'client_credentials',
      //   options: {
      //     disabled: false,
      //     options: [
      //       {
      //         label: 'Client Credentials',
      //         value: 'client_credentials',
      //       },
      //       {
      //         label: 'Client Credentials + Public Key',
      //         value: 'client_credentials_with_public_key',
      //       },
      //     ],
      //   },
      // }),
      clientId: Property.ShortText({
        displayName: 'Cashfree Client ID',
        description: 'Your Cashfree Client ID',
        required: false,
      }),
      clientSecret: Property.ShortText({
        displayName: 'Cashfree Client Secret',
        description: 'Your Cashfree Client Secret',
        required: false,
      }),
      // publicKey: Property.LongText({
      //   displayName: 'Public Key',
      //   description: 'Your Cashfree public key in PEM format (required for Cashgram operations)',
      //   required: false,
      // }),
    },
    required: true,
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://cdn.activepieces.com/pieces/cashfree-payments.png',
  authors: ['kartikvyas', 'sanket-a11y'],
  actions: [
    createOrder,
    createPaymentLink,
    createRefund,
    cancelPaymentLink,
    fetchPaymentLinkDetails,
    createCashgram,
    getOrdersForPaymentLink,
    getAllRefundsForOrder,
    deactivateCashgram
  ],
  triggers: [],
});
