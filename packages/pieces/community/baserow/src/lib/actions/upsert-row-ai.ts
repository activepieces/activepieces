import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { ensureSelectOptionsExist, makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { upsertRowOutputSchema } from '../output-schemas';

export const upsertRowAiAction = createAction({
  name: 'baserow_upsert_row_ai',
  classification: 'WRITE',
  outputSchema: upsertRowOutputSchema,
  displayName: 'Upsert Row',
  description: 'Updates the row matching a key field value, or creates it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up the first row whose match field equals the match value; updates it with the given fields if found, otherwise creates a new row with those fields plus the match value. Use to sync records by a unique key (email, external ID) without duplicates. Idempotent only when the match value is unique in the table — the lookup and write are separate calls, so concurrent calls can still create two rows.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    match_field: Property.ShortText({
      displayName: 'Match Field Name',
      description: 'Exact name of the key field to match on (a text, number, email, URL or similar field).',
      required: true,
    }),
    match_value: Property.ShortText({
      displayName: 'Match Value',
      description: 'The key value to look for.',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description:
        'JSON object of field name to value to write on the matched or new row. Formats match Create Row. The match field is not changed on an existing row.',
      required: true,
    }),
    create_missing_select_options: Property.Checkbox({
      displayName: 'Create Missing Select Options',
      description:
        'Adds single/multiple select values that do not exist yet as new options before writing. Requires an Email & Password connection.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { table_id, match_field, match_value, fields, create_missing_select_options } =
      context.propsValue;
    baserowAiHelpers.assertSelectOptionsAllowed({
      auth: context.auth,
      createMissingSelectOptions: create_missing_select_options,
    });
    const payload = baserowAiHelpers.toRecord({ value: fields, propName: 'Fields' });
    const client = await makeClient(context.auth);
    return await baserowAiHelpers.execute(async () => {
      const tableFields = await client.listTableFields(table_id);
      const matchField = tableFields.find((f) => f.name === match_field);
      if (!matchField) {
        throw new Error(
          `Field "${match_field}" was not found in table ${table_id}. Available fields: ${tableFields.map((f) => f.name).join(', ')}.`
        );
      }
      const existing = await client.queryRows({
        tableId: table_id,
        query: { size: '1', [`filter__field_${matchField.id}__equal`]: match_value },
      });
      const existingRow = existing.results[0];
      const rowPayload = existingRow
        ? Object.fromEntries(Object.entries(payload).filter(([key]) => key !== matchField.name))
        : { ...payload, [matchField.name]: payload[matchField.name] ?? match_value };
      if (create_missing_select_options) {
        await ensureSelectOptionsExist({ fields: tableFields, payload: rowPayload, client });
      }
      if (existingRow) {
        const row = await client.updateRow(table_id, existingRow.id, rowPayload);
        return { action: 'updated', row };
      }
      const row = await client.createRow(table_id, rowPayload);
      return { action: 'created', row };
    });
  },
});
