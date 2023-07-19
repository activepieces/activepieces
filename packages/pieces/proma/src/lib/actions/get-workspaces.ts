import { createAction } from '@activepieces/pieces-framework';
import { getWorkSpaces } from '../common/data';
import { promaAuth } from '../..';

export const getPromaWorkspaces = createAction({
  name: 'get_proma_workspaces', 
  displayName: 'Get Workspaces',
  description: '',
  auth: promaAuth,
  props: {
  },
  async run(context) {
    const api_key = context.auth;
    if (api_key) {
      const temp = await getWorkSpaces(api_key).catch(
        () => []
      );
      return { workspaces: temp };
    }
    return { workspaces: [] };
  },
});
