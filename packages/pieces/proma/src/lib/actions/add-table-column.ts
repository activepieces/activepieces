import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';

export const addPromaTableColumn = createAction({
  name: 'add_proma_table_column', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Add column',
  description: '',
  props: {
    api_key: promaProps.api_key,
    // organization_id: promaProps.organization_id(true),
    workspace_id: promaProps.workspace_id(true),
    table_id: promaProps.table_id(true),
    column_name: promaProps.column_name(true),
    column_data_type: promaProps.column_data_type(true),
  },
  async run(context) {
    return {
      api_key: context.propsValue.api_key,
    };
  },
});
