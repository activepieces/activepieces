import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import * as actions from './lib/actions/index'
import { justInvoiceAuth } from './lib/common/auth'

export const justInvoice = createPiece({
    displayName: 'JustInvoice',
    description: 'Create and manage invoices with JustInvoice API',
    auth: justInvoiceAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/just-invoice.png',
    authors: ['onyedikachi-david'],
    actions: [
        actions.createInvoice,
        actions.getInvoice,
        actions.markInvoiceFinal,
        actions.markInvoiceCancelled,
        actions.markInvoicePaid,
        actions.deleteInvoice,
    ],
    triggers: [],
})
