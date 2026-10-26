import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetTableOutputSchema } from '../../output-schemas';

export const getTableAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_table',
  outputSchema: metabaseGetTableOutputSchema,
  displayName: 'Get Table',
  description: 'Get a table by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns one table's settings (display name, description, visibility, schema, database). Use Get Table Metadata for its fields.",
    idempotent: true,
  },
  props: {
    tableId: metabaseAiProps.tableId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getTable({
      auth,
      tableId: propsValue.tableId,
    });
  },
});
