import { comfyIcuAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { comfyIcuApiCall, commonProps } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getRunOutputAction = createAction({
  auth: comfyIcuAuth,
  name: 'get-run-output',
  displayName: 'Get Run Output',
  description: 'Retrieves generated images or videos from a completed run.',
  audience: 'both',
  aiMetadata: { description: 'Fetches the output artifacts (generated images/videos) of a specific Comfy.ICU workflow run, identified by workflow ID and run ID. Use after a run has completed to collect its produced files. Requires a valid run ID; read-only and safe to repeat.', idempotent: true },
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

    const runOutput = response.body as { output: Array<Record<string,any>> };
    return { result: runOutput.output };
  },
});
