import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hystructAuth } from '../../index';
import { hystructApiCall } from '../common';

export const createJob = createAction({
  auth: hystructAuth,
  name: 'create_job',
  displayName: 'Create Job',
  description: 'Create and queue a new job to run for a workflow',
  props: {
    workflowId: Property.ShortText({
      displayName: 'Workflow ID',
      description: 'The ID of the workflow to run',
      required: true,
    }),
  },
  async run(context) {
    const { workflowId } = context.propsValue;

    const response = await hystructApiCall<{ message: string }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: `/v1/workflows/${workflowId}/queue`,
    });

    return response;
  },
});
