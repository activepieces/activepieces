import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import {
  baserowCommon,
  ensureSelectOptionsExist,
  formatFieldValues,
  makeClient,
} from '../common';

export const createRowAction = createAction({
  name: 'baserow_create_row',
  displayName: 'Create Row',
  description: 'Creates a new row.',
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    table_fields: baserowCommon.tableFields(true),
    create_missing_select_options: Property.Checkbox({
      displayName: 'Create missing select options',
      description:
        'When enabled, single/multi-select values that do not yet exist in the field will be added before creating the row. Existing options are preserved.',
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
