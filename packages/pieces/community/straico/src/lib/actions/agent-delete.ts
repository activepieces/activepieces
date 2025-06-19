import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';
import { agentIdDropdown } from '../common/props';

export const agentDelete = createAction({
  auth: straicoAuth,
  name: 'agent_delete',
  displayName: 'Delete Agent',
  description: 'Delete a specific agent by its ID',
  props: {
    agentId: agentIdDropdown('Agent','Select the agent to delete')
  },
  async run({ auth, propsValue }) {
    const { agentId } = propsValue;

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    const response = await httpClient.sendRequest<{
      success: boolean;
      message: string;
    }>({
      url: `${baseUrlv0}/agent/${agentId}`,
      method: HttpMethod.DELETE,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
    });

    return response.body;
  },
});
