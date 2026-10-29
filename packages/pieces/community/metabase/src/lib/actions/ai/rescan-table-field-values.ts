import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const rescanTableFieldValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_rescan_table_field_values',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Rescan Table Field Values',
  description: 'Start a rescan of filter values for a table.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Starts a background rescan of the distinct values Metabase caches for the table's filter dropdowns; returns before it finishes. Needs an admin key.",
    idempotent: true,
  },
  props: {
    tableId: metabaseAiProps.tableId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.rescanTableFieldValues({
      auth,
      tableId: propsValue.tableId,
    });
  },
});
