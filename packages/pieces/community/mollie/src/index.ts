import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { mollieCreateCustomer } from './lib/actions/create-customer'
import { mollieCreateOrder } from './lib/actions/create-order'
import { mollieCreatePayment } from './lib/actions/create-payment'
import { mollieCreatePaymentLink } from './lib/actions/create-payment-link'
import { mollieCreatePaymentRefund } from './lib/actions/create-payment-refund'
import { mollieSearchCustomer } from './lib/actions/search-customer'
import { mollieSearchOrder } from './lib/actions/search-order'
import { mollieSearchPayment } from './lib/actions/search-payment'
import { mollieAuth } from './lib/auth'
import { mollieNewChargeback } from './lib/triggers/new-chargeback'
import { mollieNewCustomer } from './lib/triggers/new-customer'
import { mollieNewInvoice } from './lib/triggers/new-invoice'
import { mollieNewOrder } from './lib/triggers/new-order'
import { mollieNewPayment } from './lib/triggers/new-payment'
import { mollieNewRefund } from './lib/triggers/new-refund'
import { mollieNewSettlement } from './lib/triggers/new-settlement'

export const mollie = createPiece({
    displayName: 'Mollie',
    auth: mollieAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/mollie.png',
    authors: ['onyedikachi-david', 'Ani-4x'],
    description:
        'Automate Mollie payments, orders, refunds, customers, and invoices. Triggers on payment events and statuses.',
    categories: [PieceCategory.PAYMENT_PROCESSING],
    actions: [
        mollieCreateOrder,
        mollieCreatePaymentLink,
        mollieCreatePayment,
        mollieCreateCustomer,
        mollieCreatePaymentRefund,
        mollieSearchOrder,
        mollieSearchPayment,
        mollieSearchCustomer,
    ],
    triggers: [
        mollieNewCustomer,
        mollieNewOrder,
        mollieNewSettlement,
        mollieNewInvoice,
        mollieNewPayment,
        mollieNewRefund,
        mollieNewChargeback,
    ],
})
