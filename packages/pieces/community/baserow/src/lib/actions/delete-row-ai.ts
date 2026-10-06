import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { deleteRowAiOutputSchema } from '../output-schemas';

export const deleteRowAiAction = createAction({
  name: 'baserow_delete_row_ai',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteRowAiOutputSchema,
  displayName: 'Delete Row',
  description: 'Deletes a row by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one row from a Baserow table by numeric row ID; the row moves to the Baserow trash and can be restored there. For many rows use Batch Delete Rows. Confirm the ID first with Find Row or Get Row. Not idempotent — a repeat call fails because the row is gone.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    row_id: baserowAiProps.rowIdProp(),
  },
  async run(context) {
    const { table_id, row_id } = context.propsValue;
    const client = await makeClient(context.auth);
    await baserowAiHelpers.execute(() => client.deleteRow(table_id, row_id));
    return { deleted: true, table_id, row_id };
  },
});
