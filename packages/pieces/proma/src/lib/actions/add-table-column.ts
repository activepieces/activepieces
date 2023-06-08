import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { insertTableColumn } from '../common/data';

export const addPromaTableColumn = createAction({
  name: 'add_proma_table_column', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Add Column',
  description: '',
  props: {
    api_key: promaProps.api_key,
    // organization_id: promaProps.organization_id(true),
    workspace_id: promaProps.workspace_id(true),
    table_id: promaProps.table_id(true, "write"),
    column_name: promaProps.column_name(true),
    column_data_type: promaProps.column_data_type(true),
  },
  async run(context) {
    const api_key = context.propsValue.api_key;
    // const organization_id = context.propsValue.organization_id;
    const workspace_id = context.propsValue.workspace_id;
    const table_id = context.propsValue.table_id;
    const name = context.propsValue.column_name;
    const dataType = context.propsValue.column_data_type;
    if (api_key && workspace_id && table_id) {
      const temp = await insertTableColumn({ api_key, workspace_id, table_id, data: { name, dataType } }).catch(
        () => null
      );
      return { data: temp };
    }
    return null;
  },
});
