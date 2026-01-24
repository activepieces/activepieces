import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const findJournalBatches = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'find_journal_batches',
    displayName: 'Find Journal Batches',
    description: 'Search for journal batches with optional filters.',
    props: {
        batchName: Property.ShortText({
            displayName: 'Batch Name',
            description: 'Filter by batch name.',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Filter by batch status.',
            required: false,
            options: {
                options: [
                    { label: 'Unposted', value: 'U' },
                    { label: 'Posted', value: 'P' },
                    { label: 'Error', value: 'E' },
                ],
            },
        }),
        defaultPeriodName: Property.ShortText({
            displayName: 'Period Name',
            description: 'Filter by accounting period name.',
            required: false,
        }),
        userJeSourceName: Property.ShortText({
            displayName: 'Journal Source',
            description: 'Filter by journal source name.',
            required: false,
        }),
        createdBy: Property.ShortText({
            displayName: 'Created By',
            description: 'Filter by the user who created the batch.',
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
        const { batchName, status, defaultPeriodName, userJeSourceName, createdBy, limit, offset } = context.propsValue;

        const queryParams: Record<string, string | number> = {
            limit: Math.min(limit || 25, 500),
            offset: offset || 0,
        };

        const filters: string[] = [];
        if (batchName) filters.push(`BatchName LIKE "*${batchName}*"`);
        if (status) filters.push(`Status="${status}"`);
        if (defaultPeriodName) filters.push(`DefaultPeriodName="${defaultPeriodName}"`);
        if (userJeSourceName) filters.push(`UserJeSourceName="${userJeSourceName}"`);
        if (createdBy) filters.push(`CreatedBy="${createdBy}"`);

        if (filters.length > 0) {
            queryParams['q'] = filters.join(' AND ');
        }

        const response = await client.searchRecords('/journalBatches', queryParams);
        return response;
    },
});
