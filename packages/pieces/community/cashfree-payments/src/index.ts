
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
  auth: PieceAuth.CustomAuth({
    description: 'Choose your Cashfree authentication method',
    props: {
      authType: Property.StaticDropdown({
        displayName: 'Authentication Type',
        description: 'Choose authentication method based on your use case',
        required: true,
        defaultValue: 'client_credentials',
        options: {
          disabled: false,
          options: [
            {
              label: 'Client Credentials',
              value: 'client_credentials',
            },
            {
              label: 'Client Credentials + Public Key',
              value: 'client_credentials_with_public_key',
            },
          ],
        },
      }),
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
      publicKey: Property.LongText({
        displayName: 'Public Key',
        description: 'Your Cashfree public key in PEM format (required for Cashgram operations)',
        required: false,
      }),
    },
    required: true,
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl:
    'https://cdn.activepieces.com/pieces/cashfreepayments.png',
  authors: ['kartikvyas','sanket-a11y'],
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
