import { createAction } from '@activepieces/pieces-framework';
import { promaProps } from '../common/props';
import { getTables } from '../common/data';

export const getPromaProjects = createAction({
  name: 'get_proma_projects', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Get Master Sheets',
  description: '',
  props: {
    api_key: promaProps.api_key,
    workspace_id: promaProps.workspace_id(true),
  },
  async run(context) {
    const api_key = context.propsValue.api_key;
    const workspace_id = context.propsValue.workspace_id;
    if (api_key && workspace_id) {
      const temp = await getTables(api_key, workspace_id).catch(() => []);
      return { sheets: temp };
    }
    return { sheets: [] };
  },
});
