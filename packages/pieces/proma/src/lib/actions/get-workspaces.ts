import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { getWorkSpaces } from '../common/data';

export const getPromaWorkspaces = createAction({
  name: 'get_proma_workspaces', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Get workspaces',
  description: '',
  props: {
    api_key: promaProps.api_key,
    organization_id: promaProps.organization_id(true),
  },
  async run(context) {
    const api_key = context.propsValue.api_key;
    const organization_id = context.propsValue.organization_id;
    if (api_key && organization_id) {
      const temp = await getWorkSpaces(api_key, organization_id).catch(
        () => []
      );
      return { workspaces: temp };
    }
    return { workspaces: [] };
  },
});
