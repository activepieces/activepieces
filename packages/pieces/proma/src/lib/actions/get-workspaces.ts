import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { getWorkSpaces } from '../common/data';

export const getPromaWorkspaces = createAction({
  name: 'get_proma_workspaces', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Get Workspaces',
  description: '',
  props: {
    api_key: promaProps.api_key,
  },
  async run(context) {
    const api_key = context.propsValue.api_key;
    if (api_key) {
      const temp = await getWorkSpaces(api_key).catch(
        () => []
      );
      return { workspaces: temp };
    }
    return { workspaces: [] };
  },
});
