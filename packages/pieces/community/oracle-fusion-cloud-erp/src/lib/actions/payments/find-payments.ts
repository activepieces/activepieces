import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const findPayments = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'find_payments',
    displayName: 'Find Payments',
    description: 'Search for payments with optional filters.',
    props: {
        paymentNumber: Property.Number({
            displayName: 'Payment Number',
            description: 'Filter by payment number.',
            required: false,
        }),
        payee: Property.ShortText({
            displayName: 'Payee',
            description: 'Filter by payee name.',
            required: false,
        }),
        businessUnit: Property.ShortText({
            displayName: 'Business Unit',
            description: 'Filter by business unit.',
            required: false,
        }),
        paymentStatus: Property.StaticDropdown({
            displayName: 'Payment Status',
            description: 'Filter by payment status.',
            required: false,
            options: {
                options: [
                    { label: 'Negotiable', value: 'Negotiable' },
                    { label: 'Voided', value: 'Voided' },
                    { label: 'Stopped', value: 'Stopped' },
                    { label: 'Cleared', value: 'Cleared' },
                ],
            },
        }),
        paymentDateFrom: Property.ShortText({
            displayName: 'Payment Date From',
            description: 'Filter payments on or after this date (YYYY-MM-DD).',
            required: false,
        }),
        paymentDateTo: Property.ShortText({
            displayName: 'Payment Date To',
            description: 'Filter payments on or before this date (YYYY-MM-DD).',
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
        const { paymentNumber, payee, businessUnit, paymentStatus, paymentDateFrom, paymentDateTo, limit, offset } = context.propsValue;

        const queryParams: Record<string, string | number> = {
            limit: Math.min(limit || 25, 500),
            offset: offset || 0,
        };

        const filters: string[] = [];
        if (paymentNumber) filters.push(`PaymentNumber=${paymentNumber}`);
        if (payee) filters.push(`Payee="${payee}"`);
        if (businessUnit) filters.push(`BusinessUnit="${businessUnit}"`);
        if (paymentStatus) filters.push(`PaymentStatus="${paymentStatus}"`);
        if (paymentDateFrom) filters.push(`PaymentDate>="${paymentDateFrom}"`);
        if (paymentDateTo) filters.push(`PaymentDate<="${paymentDateTo}"`);

        if (filters.length > 0) {
            queryParams['q'] = filters.join(' AND ');
        }

        const response = await client.searchRecords('/payablesPayments', queryParams);
        return response;
    },
});
