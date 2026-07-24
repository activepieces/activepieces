import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { assertNotNullOrUndefined, createAction } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';

const API = 'https://api.todoist.com/api/v1';

export const todoistGetProductivityStatsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_get_productivity_stats',
  displayName: 'Get Productivity Stats',
  description: 'Retrieves the authenticated user\'s Todoist productivity statistics.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieves the authenticated user\'s Todoist productivity statistics: karma score and trend, completed-task counts, and daily and weekly goals. Use for reporting or progress summaries; for the raw list of completed tasks use List Completed Tasks instead. Takes no input; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const token = context.auth.access_token;
    assertNotNullOrUndefined(token, 'token');

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${API}/tasks/completed/stats`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    };

    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Todoist denied access to productivity stats (insufficient scope).');
      }
      if (error.response?.status === 429) {
        throw new Error('Todoist rate limit hit. Retry after a short delay.');
      }
      throw error;
    }
  },
});
