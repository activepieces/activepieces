import { createAction, Property } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';

export const findColumns = createAction({
  name: 'tables-find-columns',
  displayName: 'Find Columns',
  description: 'Find columns in a table.',
  props: {
    table_id: tablesCommon.table_id,
  },
  async run(context) {
    const tableId = await tablesCommon.convertTableExternalIdToId(context.propsValue['table_id'], context);
    const fields = await tablesCommon.getTableFields({ tableId, context })
    return fields.map((field) => {
      return {
        id: field.id,
        name: field.name,
        type: field.type,
        tableId: field.tableId,
        externalId: field.externalId,
      }
    })
  },
});
