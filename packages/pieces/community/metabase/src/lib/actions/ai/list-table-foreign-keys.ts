import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListTableForeignKeysOutputSchema } from '../../output-schemas';

export const listTableForeignKeysAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_table_foreign_keys',
  outputSchema: metabaseListTableForeignKeysOutputSchema,
  displayName: 'List Table Foreign Keys',
  description: 'List the foreign keys that point to a table.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the foreign keys in other tables that reference this table, with origin and destination field ids, to plan joins.',
    idempotent: true,
  },
  props: {
    tableId: metabaseAiProps.tableId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const foreignKeys = await metabaseApi.listTableForeignKeys({
      auth,
      tableId: propsValue.tableId,
    });
    return { foreignKeys, count: foreignKeys.length };
  },
});
