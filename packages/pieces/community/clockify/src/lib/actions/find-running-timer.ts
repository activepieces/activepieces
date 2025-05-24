import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { clockifyAuth } from '../../index';

export const findRunningTimerAction = createAction({
  auth: clockifyAuth,
  name: 'find_running_timer',
  displayName: 'Find Running Timer',
  description: 'Get all in-progress time entries in the workspace',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
      description: 'Pagination - page number (default is 1)',
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      required: false,
      defaultValue: 10,
      description: 'Number of results per page (1 - 1000)',
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { workspaceId, page = 1, pageSize = 10 } = context.propsValue;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      'page-size': pageSize.toString(),
    }).toString();

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/workspaces/${workspaceId}/time-entries/status/in-progress?${queryParams}`
    );

    return response || [];
  },
});
