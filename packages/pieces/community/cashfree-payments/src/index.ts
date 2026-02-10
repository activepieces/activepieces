
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
import { cashfreePaymentsAuth } from "./lib/auth/cashgram-auth";


export const cashfreeTriggers = createPiece({
  displayName: "Cashfree Payments",
  description: 'Cashfree Payments integration for processing payments, refunds, and managing payment links and cashgrams.',
  auth: cashfreePaymentsAuth,
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
