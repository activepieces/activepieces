import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetTableDataOutputSchema } from '../../output-schemas';

export const getTableDataAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_table_data',
  outputSchema: metabaseGetTableDataOutputSchema,
  displayName: 'Get Table Data',
  description: 'Get rows from a table.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns rows and columns from a table without writing a query. Metabase caps the rows returned; use Run Query with a LIMIT for precise control.',
    idempotent: true,
  },
  props: {
    tableId: metabaseAiProps.tableId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getTableData({
      auth,
      tableId: propsValue.tableId,
    });
  },
});
