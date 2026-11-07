import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetTableMetadataOutputSchema } from '../../output-schemas';

export const getTableMetadataAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_table_metadata',
  outputSchema: metabaseGetTableMetadataOutputSchema,
  displayName: 'Get Table Metadata',
  description: 'Get a table with its fields.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a table with its fields (ids, names, types, semantic types, foreign keys). Use it to find field ids and column names before querying.',
    idempotent: true,
  },
  props: {
    tableId: metabaseAiProps.tableId({ required: true }),
    includeHiddenFields: Property.Checkbox({
      displayName: 'Include Hidden Fields',
      description: 'Also return fields hidden in the data model.',
      required: false,
      defaultValue: false,
    }),
    includeSensitiveFields: Property.Checkbox({
      displayName: 'Include Sensitive Fields',
      description: 'Also return fields marked sensitive.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getTableMetadata({
      auth,
      tableId: propsValue.tableId,
      includeHiddenFields: propsValue.includeHiddenFields ?? false,
      includeSensitiveFields: propsValue.includeSensitiveFields ?? false,
    });
  },
});
