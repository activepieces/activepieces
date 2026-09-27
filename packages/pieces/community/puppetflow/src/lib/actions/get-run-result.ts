import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import { puppetflowRequest, runPath } from '../common/client';
import { credentialsOf, flowIdDropdown, runIdDropdown } from '../common/props';

export const getRunResultAction = createAction({
  auth: puppetflowAuth,
  name: 'get_run_result',
  displayName: 'Get Run Result',
  description: 'Get only the output, status, and timing of a run',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the output, status, error message, and duration of a Puppetflow run. Lighter than Get Run. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    flowId: flowIdDropdown,
    runId: runIdDropdown,
  },
  async run(context) {
    const { flowId, runId } = context.propsValue;
    return puppetflowRequest({
      credentials: credentialsOf(context.auth),
      method: HttpMethod.GET,
      path: `${runPath(flowId, runId)}/result`,
    });
  },
});
