import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { deleteTableOutputSchema } from '../output-schemas';

export const deleteTableAction = createAction({
  name: 'baserow_delete_table',
  classification: 'DESTRUCTIVE',
  outputSchema: deleteTableOutputSchema,
  displayName: 'Delete Table',
  description: 'Deletes a table and all its rows.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a Baserow table together with all its fields, views and rows; it moves to the Baserow trash and can be restored there until the trash is emptied. Confirm the table with Get Table first. Requires an Email & Password connection. Not idempotent — a repeat call fails because the table is gone.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
  },
  async run(context) {
    const { table_id } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Delete Table' });
    const client = await makeClient(context.auth);
    await baserowAiHelpers.execute(() => client.deleteTable({ tableId: table_id }));
    return { deleted: true, table_id };
  },
});
