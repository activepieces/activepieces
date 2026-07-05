import { createAction, Property } from '@activepieces/pieces-framework';
import { leapAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAWorkflowRun = createAction({
  auth: leapAiAuth,
  name: 'getAWorkflowRun',
  displayName: 'Get a Workflow Run',
  description: 'Retrieve the status and results of a workflow run',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches the current status and results of a single Leap AI workflow run by its run ID. Use to poll a run started by "Run a Workflow" until it completes. Requires the workflow run ID. Read-only and safe to call repeatedly.',
    idempotent: true,
  },
  props: {
    workflow_run_id: Property.ShortText({
      displayName: 'Workflow Run ID',
      description: 'The ID of the workflow run to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { workflow_run_id } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/runs/${workflow_run_id}`
    );

    return response;
  },
});
