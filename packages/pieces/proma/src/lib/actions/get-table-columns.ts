import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { getTableColumns } from '../common/data';
import { promaAuth } from '../..';

export const getPromaTableColumns = createAction({
  name: 'get_proma_table_columns', 
  displayName: 'Get Columns',
  description: '',
  auth: promaAuth,
  props: {
    workspace_id: promaProps.workspace_id(true),
    table_id: promaProps.table_id(true),
  },
  async run(context) {
    const api_key = context.auth;
    const table_id = context.propsValue.table_id;
    if (api_key && table_id) {
      const temp = await getTableColumns(api_key, table_id).catch(() => []);
      return { columns: temp };
    }
    return { columns: [] };
  },
});
