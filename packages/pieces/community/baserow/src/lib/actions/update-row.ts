import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import {
  baserowCommon,
  ensureSelectOptionsExist,
  formatFieldValues,
  makeClient,
} from '../common';
import { rowOutputSchema } from '../output-schemas';

export const updateRowAction = createAction({
  name: 'baserow_update_row',
  classification: 'WRITE',
  outputSchema: rowOutputSchema,
  displayName: 'Update Row',
  description: 'Changes fields in an existing row.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates field values on one existing Baserow row identified by its numeric row ID. Only the fields you supply are changed and empty values are skipped, so it cannot clear a field — use Clean Row for that. Requires a known row ID (resolve one first with Find Row or List Rows if needed). Optionally auto-creates missing single/multi-select options. Idempotent: applying the same values to the same row leaves it in the same state.',
    idempotent: true,
  },
  auth: baserowAuth,
  propertyGroups: [
    {
      key: 'row',
      display: 'section',
      label: 'Row to Update',
      icon: 'file',
      props: ['table_id', 'row_id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'text',
      props: ['info', 'table_fields'],
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
    row_id: baserowCommon.rowId(),
    info: Property.MarkDown({
      value:
        'Empty fields keep their current value. Checkboxes are always saved as shown.',
      variant: MarkdownVariant.INFO,
    }),
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
    const row_id = context.propsValue.row_id!;
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

    return await client.updateRow(table_id, row_id, formattedFields);
  },
});
