import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleTasksCommon, TasksListResponse } from '../common';
import { googleTasksAuth } from '../auth';

export const googleTasksListTaskListsAction = createAction({
  auth: googleTasksAuth,
  name: 'list_task_lists',
  displayName: 'List Task Lists',
  description: "List the authenticated user's task lists (id and title).",
  audience: 'ai',
  aiMetadata: {
    description:
      "List the authenticated user's task lists, returning each list's id and title. Use to resolve a list name to its id before operating on tasks, or to discover available lists. Read-only.",
    idempotent: true,
  },
  props: {
    max_results: Property.Number({
      displayName: 'Max Results',
      description:
        'Maximum number of task lists to return (1–100). Defaults to 20 when omitted.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authProp = auth as OAuth2PropertyValue;
    const { max_results } = propsValue;

    const queryParams: Record<string, string> = {};
    if (max_results) {
      queryParams['maxResults'] = String(max_results);
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleTasksCommon.baseUrl}/tasks/v1/users/@me/lists`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authProp.access_token,
      },
      queryParams,
    };

    const response = await httpClient.sendRequest<TasksListResponse>(request);
    const taskLists = response.body.items ?? [];

    return {
      taskLists,
      count: taskLists.length,
    };
  },
});
