import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const getJournalBatch = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'get_journal_batch',
    displayName: 'Get Journal Batch',
    description: 'Retrieves details of a specific journal batch by ID.',
    props: {
        jeBatchId: Property.ShortText({
            displayName: 'Journal Batch ID',
            description: 'The unique identifier of the journal batch.',
            required: true,
        }),
        expand: Property.StaticMultiSelectDropdown({
            displayName: 'Expand Child Resources',
            description: 'Select child resources to include in the response.',
            required: false,
            options: {
                options: [
                    { label: 'Journal Headers', value: 'journalHeaders' },
                    { label: 'Journal Errors', value: 'journalErrors' },
                    { label: 'Action Logs', value: 'journalActionLogs' },
                    { label: 'Attachments', value: 'batchAttachment' },
                    { label: 'Descriptive Flexfields', value: 'journalBatchDFF' },
                ],
            },
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { jeBatchId, expand } = context.propsValue;

        const queryParams: Record<string, string> = {};
        if (expand && expand.length > 0) {
            queryParams['expand'] = expand.join(',');
        }

        const response = await client.searchRecords(`/journalBatches/${jeBatchId}`, queryParams);
        return response;
    },
});
