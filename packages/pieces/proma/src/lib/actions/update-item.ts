import { Property, createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { updateTableRow } from '../common/data';

export const updatePromaRow = createAction({
  name: 'update_proma_sheet_row', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Update Row',
  description: 'Update a row in master sheet',
  props: {
    api_key: promaProps.api_key,
    workspace_id: promaProps.workspace_id(true),
    table_id: promaProps.table_id(true, "write"),
    row_id: promaProps.row_id(true),
    dataRow: promaProps.data_row(true)
  },
  async run(context) {
    const api_key = context.propsValue.api_key;
    // const organization_id = context.propsValue.organization_id;
    const workspace_id = context.propsValue.workspace_id;
    const table_id = context.propsValue.table_id;
    const dataRow = context.propsValue.dataRow;
    const ROWID = context.propsValue.row_id;
    if (api_key && workspace_id && table_id) {
      const temp = await updateTableRow({ api_key, workspace_id, table_id, data: { ROWID, ...dataRow } }).catch(
        () => null
      );
      return { data: temp };
    }
    return null;
  },
});
