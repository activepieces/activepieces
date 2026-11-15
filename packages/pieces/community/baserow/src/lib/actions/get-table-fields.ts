import { createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { getTableFieldsOutputSchema } from '../output-schemas';

export const getTableFieldsAction = createAction({
  name: 'baserow_get_table_fields',
  classification: 'READ',
  outputSchema: getTableFieldsOutputSchema,
  displayName: 'Get Table Fields',
  description: 'Lists the fields (columns) of a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns every field of a Baserow table with its ID, name, type, primary/read-only flags and select options. Call before creating, updating or filtering rows to learn exact field names, types and valid select values. Works with Database Token and Email & Password connections. Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
  },
  async run(context) {
    const { table_id } = context.propsValue;
    const client = await makeClient(context.auth);
    const fields = await baserowAiHelpers.execute(() => client.listTableFields(table_id));
    return {
      count: fields.length,
      fields: fields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        primary: field.primary,
        read_only: field.read_only,
        select_options:
          'select_options' in field
            ? field.select_options.map((option) => ({ id: option.id, value: option.value }))
            : undefined,
        link_row_table_id: 'link_row_table_id' in field ? field.link_row_table_id : undefined,
      })),
    };
  },
});
