import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createCompanyAction } from './lib/actions/create-company'
import { createFileAction } from './lib/actions/create-file'
import { createManualEntryAction } from './lib/actions/create-manual-entry'
import { createPersonAction } from './lib/actions/create-person'
import { createProductAction } from './lib/actions/create-product'
import { createProjectAction } from './lib/actions/create-project'
import { createSalesInvoiceAction } from './lib/actions/create-sales-invoice'
import { createSalesOrderAction } from './lib/actions/create-sales-order'
import { createSalesQuoteAction } from './lib/actions/create-sales-quote'
import { createTimeTrackingAction } from './lib/actions/create-time-tracking'
import { exportInvoicePdfAction } from './lib/actions/export-invoice-pdf'
import { findAccountAction } from './lib/actions/find-account'
import { findCompanyAction } from './lib/actions/find-company'
import { findCountryAction } from './lib/actions/find-country'
import { findPersonAction } from './lib/actions/find-person'
import { findProductAction } from './lib/actions/find-product'
import { searchInvoiceAction } from './lib/actions/search-invoice'
import { searchOrderAction } from './lib/actions/search-order'
import { searchQuoteAction } from './lib/actions/search-quote'
import { sendSalesInvoiceAction } from './lib/actions/send-sales-invoice'
import { updateCompanyAction } from './lib/actions/update-company'
import { updatePersonAction } from './lib/actions/update-person'
import { updateProductAction } from './lib/actions/update-product'
import { bexioAuth } from './lib/auth'
import { BexioClient } from './lib/common/client'
import { newOrderTrigger } from './lib/triggers/new-order'
import { newProductTrigger } from './lib/triggers/new-product'
import { newProjectTrigger } from './lib/triggers/new-project'
import { newQuoteTrigger } from './lib/triggers/new-quote'
import { newSalesInvoiceTrigger } from './lib/triggers/new-sales-invoice'
import { newUpdatedCompanyTrigger } from './lib/triggers/new-updated-company'
import { newUpdatedPersonTrigger } from './lib/triggers/new-updated-person'

export const bexio = createPiece({
    displayName: 'Bexio',
    description: 'Swiss business software for accounting, invoicing, and project management',
    auth: bexioAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/bexio.png',
    authors: ['onyedikachi-david'],
    categories: [PieceCategory.BUSINESS_INTELLIGENCE],
    actions: [
        createManualEntryAction,
        createCompanyAction,
        createPersonAction,
        updatePersonAction,
        updateCompanyAction,
        findAccountAction,
        findCompanyAction,
        findPersonAction,
        findProductAction,
        findCountryAction,
        searchInvoiceAction,
        searchOrderAction,
        searchQuoteAction,
        createFileAction,
        createSalesInvoiceAction,
        exportInvoicePdfAction,
        sendSalesInvoiceAction,
        createProductAction,
        updateProductAction,
        createSalesOrderAction,
        createProjectAction,
        createSalesQuoteAction,
        createTimeTrackingAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://api.bexio.com',
            auth: bexioAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${auth.access_token}`,
            }),
        }),
    ],
    triggers: [
        newUpdatedCompanyTrigger,
        newUpdatedPersonTrigger,
        newProductTrigger,
        newProjectTrigger,
        newSalesInvoiceTrigger,
        newOrderTrigger,
        newQuoteTrigger,
    ],
})
