import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { skyvernAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAWorkflowRunById = createAction({
  auth: skyvernAuth,
  name: 'getAWorkflowRunById',
  displayName: 'Get a Workflow Run by ID',
  description: 'Get run information (task run, workflow run) by its ID',
  props: {
    run_id: Property.ShortText({
      displayName: 'Run ID',
      description: 'The ID of the task run or workflow run',
      required: true,
    }),
  },
  async run(context) {
    const { run_id } = context.propsValue;

    const response = await makeRequest(
      { apiKey: context.auth.apiKey },
      HttpMethod.GET,
      `/runs/${run_id}`,
      {}
    );

    return response;
  },
});
