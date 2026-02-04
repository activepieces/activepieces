import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const findInvoices = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'find_invoices',
    displayName: 'Find Invoices',
    description: 'Search for payables invoices with optional filters.',
    props: {
        invoiceNumber: Property.ShortText({
            displayName: 'Invoice Number',
            description: 'Filter by invoice number.',
            required: false,
        }),
        supplier: Property.ShortText({
            displayName: 'Supplier',
            description: 'Filter by supplier name.',
            required: false,
        }),
        businessUnit: Property.ShortText({
            displayName: 'Business Unit',
            description: 'Filter by business unit.',
            required: false,
        }),
        validationStatus: Property.StaticDropdown({
            displayName: 'Validation Status',
            description: 'Filter by validation status.',
            required: false,
            options: {
                options: [
                    { label: 'Not Validated', value: 'Not Validated' },
                    { label: 'Validated', value: 'Validated' },
                    { label: 'Needs Revalidation', value: 'Needs Revalidation' },
                ],
            },
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
        const { invoiceNumber, supplier, businessUnit, validationStatus, limit, offset } = context.propsValue;

        const queryParams: Record<string, string | number> = {
            limit: Math.min(limit || 25, 500),
            offset: offset || 0,
        };

        const filters: string[] = [];
        if (invoiceNumber) filters.push(`InvoiceNumber="${invoiceNumber}"`);
        if (supplier) filters.push(`Supplier="${supplier}"`);
        if (businessUnit) filters.push(`BusinessUnit="${businessUnit}"`);
        if (validationStatus) filters.push(`ValidationStatus="${validationStatus}"`);

        if (filters.length > 0) {
            queryParams['q'] = filters.join(' AND ');
        }

        const response = await client.searchRecords('/invoices', queryParams);
        return response;
    },
});
