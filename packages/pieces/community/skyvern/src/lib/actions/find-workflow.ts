import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { skyvernAuth } from '../../index';

export const findWorkflowAction = createAction({
  auth: skyvernAuth,
  name: 'find_workflow',
  displayName: 'Find Workflow',
  description: 'Finds workflows based on the provided title.',
  props: {
    title: Property.ShortText({
      displayName: 'Workflow Title',
      description: 'The title of the workflow to search for.',
      required: true,
    }),
  },
  async run(context) {
    const { title } = context.propsValue;
    const { apiKey } = context.auth as { apiKey: string };

    const queryParams = new URLSearchParams({ title });

    const result = await makeRequest(
      { apiKey },
      HttpMethod.GET,
      `/workflows?${queryParams.toString()}`
    );

    return result;
  },
});
