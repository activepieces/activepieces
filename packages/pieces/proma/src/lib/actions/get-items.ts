import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { getTableRows } from '../common/data';

export const getPromaTableRows = createAction({
  name: 'get_proma_table_rows', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Get Items',
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
      const temp = await getTableRows(api_key, table_id).catch(() => []);
      return { rows: temp };
    }
    return { rows: [] };
  },
});
