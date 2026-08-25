import { comfyIcuAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { comfyIcuApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const listWorkflowsAction = createAction({
  auth: comfyIcuAuth,
  name: 'list-workflows',
  displayName: 'List Workflows',
  description: 'Retrieves available workflows for execution.',
  audience: 'both',
  aiMetadata: { description: 'Lists all Comfy.ICU workflows available on the connected account. Use to discover workflow IDs before submitting a run or fetching run details. Takes no input; read-only and safe to repeat.', idempotent: true },
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
