import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { tableOutputSchema } from '../output-schemas';

export const updateTableAction = createAction({
  name: 'baserow_update_table',
  classification: 'WRITE',
  outputSchema: tableOutputSchema,
  displayName: 'Rename Table',
  description: 'Renames a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames an existing Baserow table. Requires an Email & Password connection. Idempotent — applying the same name again changes nothing.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new table name.',
      required: true,
    }),
  },
  async run(context) {
    const { table_id, name } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Rename Table' });
    const client = await makeClient(context.auth);
    return await baserowAiHelpers.execute(() => client.updateTable({ tableId: table_id, name }));
  },
});
