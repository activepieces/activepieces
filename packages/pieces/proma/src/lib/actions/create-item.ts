import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { insertTableRow } from '../common/data';
import { promaAuth } from '../..';

export const addPromaRow = createAction({
  name: 'add_proma_sheet_row', 
  displayName: 'Add Row',
  description: 'Add a row in master sheet',
  auth: promaAuth,
  props: {
    workspace_id: promaProps.workspace_id(true),
    table_id: promaProps.table_id(true,"write"),
    dataRow: promaProps.data_row(true)
  },
  async run(context) {
    const api_key = context.auth;
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
