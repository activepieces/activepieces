import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { fieldOutputSchema } from '../output-schemas';

export const createFieldAction = createAction({
  name: 'baserow_create_field',
  classification: 'WRITE',
  outputSchema: fieldOutputSchema,
  displayName: 'Create Field',
  description: 'Adds a field (column) to a table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a new field to a Baserow table with a given name and type, plus optional type-specific settings (select options, number decimals, linked table, formula). Use Get Table Fields first to avoid duplicate names. Requires an Email & Password connection — Database Tokens cannot create fields. Not idempotent — a repeat call fails on the duplicate name.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new field. Must be unique in the table.',
      required: true,
    }),
    type: Property.ShortText({
      displayName: 'Type',
      description:
        'Baserow field type, e.g. text, long_text, number, boolean, date, email, url, phone_number, rating, single_select, multiple_select, link_row, file, formula, duration, autonumber.',
      required: true,
    }),
    options: Property.Json({
      displayName: 'Type Options',
      description:
        'Optional JSON object of type-specific settings, e.g. {"number_decimal_places": 2}, {"select_options": [{"value": "Open", "color": "blue"}]}, {"link_row_table_id": 12}, {"formula": "field(\'Price\') * 2"}, {"date_include_time": true}.',
      required: false,
    }),
  },
  async run(context) {
    const { table_id, name, type, options } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Create Field' });
    const extra = options ? baserowAiHelpers.toRecord({ value: options, propName: 'Type Options' }) : {};
    const client = await makeClient(context.auth);
    return await baserowAiHelpers.execute(() =>
      client.createField({ tableId: table_id, body: { ...extra, name, type } })
    );
  },
});
