import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const updateJournalBatch = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'update_journal_batch',
    displayName: 'Update Journal Batch',
    description: 'Updates batch completion status and reversal attributes. Note: Only status and reversal attributes can be updated.',
    props: {
        jeBatchId: Property.ShortText({
            displayName: 'Journal Batch ID',
            description: 'The unique identifier of the journal batch to update.',
            required: true,
        }),
        status: Property.StaticDropdown({
            displayName: 'Batch Status',
            description: 'The status of the batch.',
            required: false,
            options: {
                options: [
                    { label: 'Unposted', value: 'U' },
                    { label: 'Posted', value: 'P' },
                ],
            },
        }),
        reversalFlag: Property.Checkbox({
            displayName: 'Reverse Journals',
            description: 'Indicates whether to reverse all journals in the batch.',
            required: false,
            defaultValue: false,
        }),
        reversalDate: Property.ShortText({
            displayName: 'Reversal Date',
            description: 'The reversal date for the journals in the batch (YYYY-MM-DD).',
            required: false,
        }),
        reversalPeriod: Property.ShortText({
            displayName: 'Reversal Period',
            description: 'The reversal period for the journals in the batch.',
            required: false,
        }),
        reversalMethodMeaning: Property.StaticDropdown({
            displayName: 'Reversal Method',
            description: 'The reversal method for the journals in the batch.',
            required: false,
            options: {
                options: [
                    { label: 'Change Sign', value: 'Change sign' },
                    { label: 'Switch Debit or Credit', value: 'Switch debit or credit' },
                ],
            },
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { jeBatchId, status, reversalFlag, reversalDate, reversalPeriod, reversalMethodMeaning } = context.propsValue;

        const payload: Record<string, unknown> = {};

        if (status) payload['Status'] = status;
        if (reversalFlag !== undefined) payload['ReversalFlag'] = reversalFlag;
        if (reversalDate) payload['ReversalDate'] = reversalDate;
        if (reversalPeriod) payload['ReversalPeriod'] = reversalPeriod;
        if (reversalMethodMeaning) payload['ReversalMethodMeaning'] = reversalMethodMeaning;

        if (Object.keys(payload).length === 0) {
            throw new Error('At least one field (Status or reversal attributes) must be provided to update.');
        }

        const response = await client.updateRecord(`/journalBatches/${jeBatchId}`, payload);
        return response;
    },
});
