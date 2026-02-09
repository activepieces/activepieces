
import {
    createPiece,
    PieceAuth,
    Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

const authDesc = `
Connect to your Oracle Fusion Cloud ERP instance using Basic Authentication.

**Required:**
- **Server URL**: Your Oracle Fusion instance URL (e.g., https://your-instance.fa.us2.oraclecloud.com)
- **Username**: Your Oracle Cloud username with API access
- **Password**: Your Oracle Cloud password

Contact your Oracle administrator if you need REST API access enabled.
`;

export const oracleFusionCloudErpAuth = PieceAuth.CustomAuth({
    description: authDesc,
    required: true,
    props: {
        serverUrl: Property.ShortText({
            displayName: 'Server URL',
            description: 'Your Oracle Fusion Cloud instance URL (e.g., https://your-instance.fa.us2.oraclecloud.com)',
            required: true,
        }),
        username: Property.ShortText({
            displayName: 'Username',
            description: 'Your Oracle Cloud username',
            required: true,
        }),
        password: PieceAuth.SecretText({
            displayName: 'Password',
            description: 'Your Oracle Cloud password',
            required: true,
        }),
    },
});

import {
    createInvoice,
    getInvoice,
    findInvoices,
    updateInvoice,
    deleteInvoice,
    validateInvoice,
    cancelInvoice,
} from './lib/actions/invoices';
import {
    createReceivablesInvoice,
    getReceivablesInvoice,
    findReceivablesInvoices,
    updateReceivablesInvoice,
    deleteReceivablesInvoice,
} from './lib/actions/receivables-invoices';
import {
    createPayment,
    getPayment,
    findPayments,
    updatePayment,
    stopPayment,
    voidPayment,
} from './lib/actions/payments';
import {
    getJournalBatch,
    findJournalBatches,
    updateJournalBatch,
    deleteJournalBatch,
} from './lib/actions/journal-batches';

export const oracleFusionCloudErp = createPiece({
    displayName: 'Oracle Fusion Cloud ERP',
    description: 'Enterprise resource planning suite covering financials, procurement, project accounting, supply chain, and more.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/oracle-fusion-cloud-erp.png',
    authors: ['owuzo', 'onyedikachi-david'],
    categories: [PieceCategory.ACCOUNTING],
    auth: oracleFusionCloudErpAuth,
    actions: [
        createInvoice,
        getInvoice,
        findInvoices,
        updateInvoice,
        deleteInvoice,
        validateInvoice,
        cancelInvoice,
        createReceivablesInvoice,
        getReceivablesInvoice,
        findReceivablesInvoices,
        updateReceivablesInvoice,
        deleteReceivablesInvoice,
        createPayment,
        getPayment,
        findPayments,
        updatePayment,
        stopPayment,
        voidPayment,
        getJournalBatch,
        findJournalBatches,
        updateJournalBatch,
        deleteJournalBatch,
        createCustomApiCallAction({
            baseUrl: (auth) =>
                `${auth?.props.serverUrl}/fscmRestApi/resources/11.13.18.05`,
            auth: oracleFusionCloudErpAuth,
            authMapping: async (auth) => {
                const { username, password } = auth.props;
                return {
                    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
                };
            },
        }),
    ],
    triggers: [],
});
    