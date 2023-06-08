import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { getTableColumns } from '../common/data';

export const getPromaTableColumns = createAction({
  name: 'get_proma_table_columns', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Get Columns',
  description: '',
  props: {
    api_key: promaProps.api_key,
    workspace_id: promaProps.workspace_id(true),
    table_id: promaProps.table_id(true),
  },
  async run(context) {
    const api_key = context.propsValue.api_key;
    const table_id = context.propsValue.table_id;
    if (api_key && table_id) {
      const temp = await getTableColumns(api_key, table_id).catch(() => []);
      return { columns: temp };
    }
    return { columns: [] };
  },
});
