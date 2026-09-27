import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { tableOutputSchema } from '../output-schemas';

export const getTableAction = createAction({
  name: 'baserow_get_table',
  classification: 'READ',
  outputSchema: tableOutputSchema,
  displayName: 'Get Table',
  description: 'Gets a table by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns a Baserow table\'s ID, name, order and database ID. Use to confirm a table ID or its parent database; to discover tables use List Tables and for its columns use Get Table Fields. Requires an Email & Password connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
  },
  async run(context) {
    const { table_id } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Get Table' });
    const client = await makeClient(context.auth);
    return await baserowAiHelpers.execute(() => client.getTable({ tableId: table_id }));
  },
});
