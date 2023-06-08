import { Property, createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { insertTable } from '../common/data';

export const addPromaTable = createAction({
  name: 'add_proma_master_sheet', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Add Master Sheet',
  description: '',
  props: {
    api_key: promaProps.api_key,
    // organization_id: promaProps.organization_id(true),
    workspace_id: promaProps.workspace_id(true, "write"),
    table_name: promaProps.table_name(true),
    table_description: Property.LongText({ displayName: "Description", required: true, }),
    acl: promaProps.acl(true),
  },
  async run(context) {
    const api_key = context.propsValue.api_key;
    const workspace_id = context.propsValue.workspace_id;
    const name = context.propsValue.table_name;
    const description = context.propsValue.table_description;
    const acl = context.propsValue.acl;
    if (api_key && workspace_id) {
      const temp = await insertTable({ api_key, workspace_id, data: { name, description, acl } }).catch(
        () => null
      );
      return { data: temp };
    }
    return null;
  },
});
