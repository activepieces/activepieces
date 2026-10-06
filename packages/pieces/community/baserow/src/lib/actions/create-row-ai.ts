import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { ensureSelectOptionsExist, makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { rowOutputSchema } from '../output-schemas';

export const createRowAiAction = createAction({
  name: 'baserow_create_row_ai',
  classification: 'WRITE',
  outputSchema: rowOutputSchema,
  displayName: 'Create Row',
  description: 'Creates a new row in a table from a JSON map of field values.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one new row in a Baserow table from a JSON object of field name to value. Call Get Table Fields first to learn field names and types; for many rows use Batch Create Rows, and to avoid duplicates by a key field use Upsert Row. Not idempotent — each call inserts another row.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    fields: Property.Json({
      displayName: 'Fields',
      description:
        'JSON object mapping field names to values, e.g. {"Name": "Acme", "Status": "Active"}. Single select takes the option name or ID; multiple select, link-to-table and collaborator fields take arrays (link rows accept row IDs or primary field values; collaborators take [{"id": 1}]). File fields take [{"name": "<file name from Upload File>"}].',
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
    const { table_id, fields, create_missing_select_options } = context.propsValue;
    baserowAiHelpers.assertSelectOptionsAllowed({
      auth: context.auth,
      createMissingSelectOptions: create_missing_select_options,
    });
    const payload = baserowAiHelpers.toRecord({ value: fields, propName: 'Fields' });
    const client = await makeClient(context.auth);
    return await baserowAiHelpers.execute(async () => {
      if (create_missing_select_options) {
        await ensureSelectOptionsExist({
          fields: await client.listTableFields(table_id),
          payload,
          client,
        });
      }
      return await client.createRow(table_id, payload);
    });
  },
});
