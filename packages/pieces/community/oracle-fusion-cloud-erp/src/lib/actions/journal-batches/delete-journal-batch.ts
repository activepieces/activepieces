import { createAction, Property } from '@activepieces/pieces-framework';
import { oracleFusionCloudErpAuth } from '../../../index';
import { makeClient } from '../../common/client';

export const deleteJournalBatch = createAction({
    auth: oracleFusionCloudErpAuth,
    name: 'delete_journal_batch',
    displayName: 'Delete Journal Batch',
    description: 'Deletes a journal batch from Oracle Fusion Cloud ERP.',
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
