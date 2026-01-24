import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const findReceivablesInvoices = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'find_receivables_invoices',
    displayName: 'Find Receivables Invoices',
    description: 'Search for receivables invoices with optional filters.',
    props: {
        transactionNumber: Property.ShortText({
            displayName: 'Transaction Number',
            description: 'Filter by transaction number.',
            required: false,
        }),
        billToCustomerNumber: Property.ShortText({
            displayName: 'Bill-to Customer Account Number',
            description: 'Filter by bill-to customer account number.',
            required: false,
        }),
        invoiceStatus: Property.StaticDropdown({
            displayName: 'Invoice Status',
            description: 'Filter by invoice status.',
            required: false,
            options: {
                options: [
                    { label: 'Complete', value: 'Complete' },
                    { label: 'Incomplete', value: 'Incomplete' },
                    { label: 'Frozen', value: 'Frozen' },
                ],
            },
        }),
        billingDateFrom: Property.ShortText({
            displayName: 'Billing Date From',
            description: 'Filter invoices with billing date on or after this date (YYYY-MM-DD).',
            required: false,
        }),
        billingDateTo: Property.ShortText({
            displayName: 'Billing Date To',
            description: 'Filter invoices with billing date on or before this date (YYYY-MM-DD).',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of records to return (default: 25, max: 500).',
            required: false,
            defaultValue: 25,
        }),
        offset: Property.Number({
            displayName: 'Offset',
            description: 'Number of records to skip for pagination.',
            required: false,
            defaultValue: 0,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { transactionNumber, billToCustomerNumber, invoiceStatus, billingDateFrom, billingDateTo, limit, offset } = context.propsValue;

        const queryParams: Record<string, string | number> = {
            limit: Math.min(limit || 25, 500),
            offset: offset || 0,
        };

        const filters: string[] = [];
        if (transactionNumber) filters.push(`TransactionNumber="${transactionNumber}"`);
        if (billToCustomerNumber) filters.push(`BillToCustomerNumber="${billToCustomerNumber}"`);
        if (invoiceStatus) filters.push(`InvoiceStatus="${invoiceStatus}"`);
        if (billingDateFrom) filters.push(`BillingDate>="${billingDateFrom}"`);
        if (billingDateTo) filters.push(`BillingDate<="${billingDateTo}"`);

        if (filters.length > 0) {
            queryParams['q'] = filters.join(' AND ');
        }

        const response = await client.searchRecords('/receivablesInvoices', queryParams);
        return response;
    },
});
