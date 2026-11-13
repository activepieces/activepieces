import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseMoveCardsOutputSchema } from '../../output-schemas';

export const discardTableFieldValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_discard_table_field_values',
  outputSchema: metabaseMoveCardsOutputSchema,
  displayName: 'Discard Table Field Values',
  description: 'Discard cached filter values for a table.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Deletes the distinct values Metabase cached for the table's filter dropdowns; they are rebuilt on the next scan. Needs an admin key.",
    idempotent: true,
  },
  props: {
    tableId: metabaseAiProps.tableId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.discardTableFieldValues({
      auth,
      tableId: propsValue.tableId,
    });
  },
});
