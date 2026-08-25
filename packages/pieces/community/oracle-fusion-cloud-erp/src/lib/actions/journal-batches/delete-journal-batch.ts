import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../auth';
import { makeClient } from '../../common/client';

export const deleteJournalBatch = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'delete_journal_batch',
    displayName: 'Delete Journal Batch',
    description: 'Deletes a journal batch from Oracle Fusion Cloud ERP.',
    audience: 'both',
    aiMetadata: { description: 'Permanently delete a general-ledger journal batch by its JeBatchId. Destructive; idempotent in effect since a removed batch cannot be deleted again. Typically only unposted batches can be removed; use when discarding a draft batch rather than correcting it (use Update Journal Batch to change status or reversal attributes).', idempotent: true },
    props: {
        jeBatchId: Property.ShortText({
            displayName: 'Journal Batch ID',
            description: 'The unique identifier of the journal batch to delete.',
            required: true,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth.props);
        const { jeBatchId } = context.propsValue;

        await client.deleteRecord(`/journalBatches/${jeBatchId}`);
        return { success: true, message: `Journal batch ${jeBatchId} deleted successfully.` };
    },
});
