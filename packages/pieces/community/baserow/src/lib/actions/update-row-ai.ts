import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { ensureSelectOptionsExist, makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { rowOutputSchema } from '../output-schemas';

export const updateRowAiAction = createAction({
  name: 'baserow_update_row_ai',
  classification: 'WRITE',
  outputSchema: rowOutputSchema,
  displayName: 'Update Row',
  description: 'Updates only the given fields of a row.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing Baserow row by ID, writing only the fields present in the JSON object and leaving all others unchanged. Pass null (or [] for select, link and file fields) to clear a cell. To update many rows use Batch Update Rows; to create-or-update by a key use Upsert Row. Idempotent — repeating the same values converges on the same state.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    row_id: baserowAiProps.rowIdProp(),
    fields: Property.Json({
      displayName: 'Fields',
      description:
        'JSON object of field name to new value, e.g. {"Status": "Done"}. Only these fields are written. Use null to clear a value. Formats match Create Row.',
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
    const { table_id, row_id, fields, create_missing_select_options } = context.propsValue;
    baserowAiHelpers.assertSelectOptionsAllowed({
      auth: context.auth,
      createMissingSelectOptions: create_missing_select_options,
    });
    const payload = baserowAiHelpers.toRecord({ value: fields, propName: 'Fields' });
    if (Object.keys(payload).length === 0) {
      throw new Error('Fields must contain at least one field to update.');
    }
    const client = await makeClient(context.auth);
    return await baserowAiHelpers.execute(async () => {
      if (create_missing_select_options) {
        await ensureSelectOptionsExist({
          fields: await client.listTableFields(table_id),
          payload,
          client,
        });
      }
      return await client.updateRow(table_id, row_id, payload);
    });
  },
});
