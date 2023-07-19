import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { getTables } from '../common/data';
import { promaAuth } from '../..';

export const getPromaProjects = createAction({
  name: 'get_proma_projects', 
  displayName: 'Get Master Sheets',
  description: '',
  auth: promaAuth,
  props: {
    workspace_id: promaProps.workspace_id(true),
  },
  async run(context) {
    const api_key = context.auth;
    const workspace_id = context.propsValue.workspace_id;
    if (api_key && workspace_id) {
      const temp = await getTables(api_key, workspace_id).catch(() => []);
      return { sheets: temp };
    }
    return { sheets: [] };
  },
});
