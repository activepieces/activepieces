import { comfyIcuAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { comfyIcuApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const listWorkflowsAction = createAction({
  auth: comfyIcuAuth,
  name: 'list-workflows',
  displayName: 'List Workflows',
  description: 'Retrieves available workflows for execution.',
  props: {},
  async run(context) {
    const response = await comfyIcuApiCall({
      apiKey: context.auth,
      endpoint: '/workflows',
      method: HttpMethod.GET,
    });

    return response.body;
  },
});
