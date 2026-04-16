import { createCustomApiCallAction } from '@activepieces/pieces-common'
import {
    createPiece,
    OAuth2PropertyValue,
    PieceAuth,
    PiecePropValueSchema,
    Property,
} from '@activepieces/pieces-framework'
import { createExpenseAction } from './actions/create-expense'
import { createInvoiceAction } from './actions/create-invoice'
import { findCustomerAction } from './actions/find-customer'
import { findInvoiceAction } from './actions/find-invoice'
import { findPaymentAction } from './actions/find-payment'
import { quickbooksAuth } from './lib/auth'
import { quickbooksCommon } from './lib/common'
import { newCustomer } from './triggers/new-customer'
import { newDeposit } from './triggers/new-deposit'
import { newExpense } from './triggers/new-expense'
import { newInvoice } from './triggers/new-invoice'
import { newTransfer } from './triggers/new-transfer'

export const quickbooks = createPiece({
    displayName: 'Quickbooks Online',
    auth: quickbooksAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/quickbooks.png',
    authors: ['onyedikachi-david'],
    actions: [
        findInvoiceAction,
        findCustomerAction,
        findPaymentAction,
        createInvoiceAction,
        createExpenseAction,
        createCustomApiCallAction({
            auth: quickbooksAuth,
            baseUrl: (auth) => {
                const authValue = auth as PiecePropValueSchema<typeof quickbooksAuth>
                const companyId = authValue.props?.['companyId']

                const apiUrl = quickbooksCommon.getApiUrl(companyId)
                return apiUrl
            },
            authMapping: async (auth) => {
                return {
                    Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
                }
            },
        }),
    ],
    triggers: [newInvoice, newExpense, newCustomer, newDeposit, newTransfer],
})
