import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { skyvernAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAgentTaskRun = createAction({
  auth: skyvernAuth,
  name: 'getAgentTaskRun',
  displayName: 'Get Agent Task Run',
  description: 'Get run information for a task run by its ID',
  props: {
    run_id: Property.ShortText({
      displayName: 'Run ID',
      description: 'The ID of the task run',
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
