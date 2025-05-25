import { comfyIcuAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { comfyIcuApiCall, commonProps } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getRunStatusAction = createAction({
  auth: comfyIcuAuth,
  name: 'get-run-status',
  displayName: 'Get Run Status',
  description: 'Retrieves the status of workflow run.',
  props: {
    ...commonProps,
  },
  async run(context) {
    const { workflow_id, run_id } = context.propsValue;
    const response = await comfyIcuApiCall({
      apiKey: context.auth,
      endpoint: `/workflows/${workflow_id}/runs/${run_id}`,
      method: HttpMethod.GET,
    });

    const runStatus = response.body as { status: string };
    return { status: runStatus.status };
  },
});
