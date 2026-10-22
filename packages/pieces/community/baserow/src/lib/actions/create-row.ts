import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import {
  baserowCommon,
  ensureSelectOptionsExist,
  formatFieldValues,
  makeClient,
} from '../common';
import { rowOutputSchema } from '../output-schemas';

export const createRowAction = createAction({
  name: 'baserow_create_row',
  classification: 'WRITE',
  outputSchema: rowOutputSchema,
  displayName: 'Create Row',
  description: 'Creates a new row in a table.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates one new row in a chosen Baserow table, setting field values by field name. Use to add a single record; for many rows at once use Batch Create Rows, and to avoid duplicates by a key field use Upsert Row. Not idempotent — each call inserts another row. Optionally auto-creates missing single/multi-select options referenced in the payload.',
    idempotent: false,
  },
  auth: baserowAuth,
  propertyGroups: [
    {
      key: 'table',
      display: 'section',
      label: 'Location',
      icon: 'location',
      props: ['table_id'],
    },
    {
      key: 'values',
      display: 'section',
      label: 'Row Values',
      icon: 'text',
      props: ['table_fields'],
    },
    {
      key: 'options',
      display: 'section',
      label: 'Options',
      icon: 'sliders',
      props: ['create_missing_select_options'],
    },
  ],
  props: {
    table_id: baserowCommon.tableId(),
    table_fields: baserowCommon.tableFields(true),
    create_missing_select_options: Property.Checkbox({
      displayName: 'Create Missing Select Options',
      description: 'Adds any select option the column does not have yet.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const table_id = context.propsValue.table_id!;
    const tableFieldsInput = context.propsValue.table_fields!;
    const createMissingSelectOptions = context.propsValue.create_missing_select_options ?? false;

    const client = await makeClient(context.auth);
    const tableSchema = await client.listTableFields(table_id);

    const fieldTypeMap: Record<string, string> = {};
    for (const column of tableSchema) {
      fieldTypeMap[column.name] = column.type;
    }

    const formattedFields = formatFieldValues(tableFieldsInput, fieldTypeMap, {
      skipEmpty: true,
    });

    if (createMissingSelectOptions) {
      await ensureSelectOptionsExist({
        fields: tableSchema,
        payload: formattedFields,
        client,
      });
    }

    return await client.createRow(table_id, formattedFields);
  },
});
