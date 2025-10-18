
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
            description: 'Choose between Client ID/Secret or Bearer Token',
            required: true,
            defaultValue: 'client_credentials',
            options: {
              disabled: false,
              options: [
                {
                  label: 'Client ID & Secret',
                  value: 'client_credentials',
                },
                {
                  label: 'Bearer Token',
                  value: 'bearer_token',
                },
              ],
            },
          }),
          clientId: Property.ShortText({
            displayName: 'Cashfree Client ID',
            description: 'Your Cashfree Payment Gateway Client ID',
            required: false,
          }),
          clientSecret: Property.ShortText({
            displayName: 'Cashfree Client Secret', 
            description: 'Your Cashfree Payment Gateway Client Secret',
            required: false,
          }),
          bearerToken: Property.ShortText({
            displayName: 'Bearer Token',
            description: 'Your Cashfree Bearer Token',
            required: false,
          }),
        },
        required: true,
      }),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cashfreelogo.cashfree.com/cashfreepayments/logopng4x/Group_4355.png",
      authors: [],
      actions: [createOrder, createPaymentLink, createRefund, cancelPaymentLink, fetchPaymentLinkDetails, createCashgram, getOrdersForPaymentLink, getAllRefundsForOrder, deactivateCashgram],
      triggers: [],
    });
    