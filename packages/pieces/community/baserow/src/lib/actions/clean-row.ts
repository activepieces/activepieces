import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, formatFieldValues, makeClient } from '../common';
import { rowOutputSchema } from '../output-schemas';

export const cleanRowAction = createAction({
  name: 'baserow_clean_row',
  classification: 'DESTRUCTIVE',
  outputSchema: rowOutputSchema,
  displayName: 'Clean Row',
  description: 'Clears the fields of a row that you leave empty.',
  audience: 'human',
  aiMetadata: {
    description:
      'Clears the supplied fields on one existing Baserow row (identified by row ID) to empty/null, including blank values that Update Row would skip. Use specifically to wipe field contents rather than set new values; to change only some fields to new values use Update Row. Idempotent: re-clearing the same row leaves it in the same empty state.',
    idempotent: true,
  },
  auth: baserowAuth,
  propertyGroups: [
    {
      key: 'row',
      display: 'section',
      label: 'Row to Clean',
      icon: 'file',
      props: ['table_id', 'row_id'],
    },
    {
      key: 'values',
      display: 'section',
      label: 'Fields',
      icon: 'trash',
      props: ['info', 'table_fields'],
    },
  ],
  props: {
    table_id: baserowCommon.tableId(),
    row_id: baserowCommon.rowId(),
    info: Property.MarkDown({
      value:
        'Fields left empty are cleared. Fields you fill in are saved as entered.',
      variant: MarkdownVariant.INFO,
    }),
    table_fields: baserowCommon.tableFields(true),
  },
  async run(context) {
    const { table_id, row_id, table_fields } = context.propsValue;

    const client = await makeClient(context.auth);
    const tableSchema = await client.listTableFields(table_id!);

    const fieldTypeMap: Record<string, string> = {};
    for (const column of tableSchema) {
      fieldTypeMap[column.name] = column.type;
    }

    const formattedFields = formatFieldValues(table_fields!, fieldTypeMap, {
      skipEmpty: false,
    });
    return await client.updateRow(table_id!, row_id!, formattedFields);
  },
});
