import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { skyvernAuth } from '../../index';

export const getWorkflowRunByIdAction = createAction({
  auth: skyvernAuth,
  name: 'get_workflow_run_by_id',
  displayName: 'Get Workflow Run by ID',
  description: 'Retrieve full run data for dashboards or audits.',
  props: {
    run_id: Property.ShortText({
      displayName: 'Run ID',
      description: 'The ID of the task run or workflow run.',
      required: true,
    }),
  },
  async run(context) {
    const { run_id } = context.propsValue;
    const { apiKey } = context.auth as { apiKey: string };

    const result = await makeRequest(
      { apiKey },
      HttpMethod.GET,
      `/runs/${run_id}`
    );

    return result;
  },
});
