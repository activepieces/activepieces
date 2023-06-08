import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';

export const addPromaTable = createAction({
  name: 'add_proma_master_sheet', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Add master sheet',
  description: '',
  props: {
    api_key: promaProps.api_key,
    // organization_id: promaProps.organization_id(true),
    workspace_id: promaProps.workspace_id(true),
    table_name: promaProps.table_name(true),
  },
  async run(context) {
    return {
      api_key: context.propsValue.api_key,
    };
  },
});
