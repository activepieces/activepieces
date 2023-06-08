import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { insertTableRow } from '../common/data';

export const addPromaRow = createAction({
  name: 'add_proma_sheet_row', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Add a row',
  description: 'Add a row in master sheet',
  props: {
    api_key: promaProps.api_key,
    // organization_id: promaProps.organization_id(true),
    workspace_id: promaProps.workspace_id(true),
    table_id: promaProps.table_id(true),
    dataRow: promaProps.data_row(true)
  },
  async run(context) {
    const api_key = context.propsValue.api_key;
    // const organization_id = context.propsValue.organization_id;
    const workspace_id = context.propsValue.workspace_id;
    const table_id = context.propsValue.table_id;
    const dataRow = context.propsValue.dataRow;
    if (api_key && workspace_id && table_id) {
      const temp = await insertTableRow({ api_key, workspace_id, table_id, data: dataRow }).catch(
        () => null
      );
      return { data: temp };
    }
    return null;
  },
});
