import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokenTerminalAuth, makeRequest } from '../common/token-terminal-api';

export const getProjectInfo = createAction({
  auth: tokenTerminalAuth,
  name: 'getProjectInfo',
  displayName: 'Get Project Info',
  description: 'Get detailed information about a specific protocol or project by its ID.',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The unique identifier for the project (e.g. uniswap, aave, ethereum)',
      required: true,
    }),
  },
  async run(context) {
    const { project_id } = context.propsValue;
    return makeRequest(context.auth as string, HttpMethod.GET, `/projects/${project_id}`);
  },
});
