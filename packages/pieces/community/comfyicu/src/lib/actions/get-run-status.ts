import { comfyIcuAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { comfyIcuApiCall, commonProps } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getRunStatusAction = createAction({
  auth: comfyIcuAuth,
  name: 'get-run-status',
  displayName: 'Get Run Status',
  description: 'Retrieves the status of workflow run.',
  audience: 'both',
  aiMetadata: { description: 'Returns the current execution status of a specific Comfy.ICU workflow run, identified by workflow ID and run ID. Use to poll or check whether a submitted run is still running, completed, or errored. Read-only and safe to repeat.', idempotent: true },
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
