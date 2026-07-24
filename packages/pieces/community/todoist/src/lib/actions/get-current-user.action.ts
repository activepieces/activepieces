import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { assertNotNullOrUndefined, createAction } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';

const API = 'https://api.todoist.com/api/v1';

export const todoistGetCurrentUserAction = createAction({
  auth: todoistAuth,
  name: 'todoist_get_current_user',
  displayName: 'Get Current User',
  description: 'Retrieves the authenticated Todoist user profile.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieves the profile of the currently authenticated Todoist user (id, email, full name, timezone, etc.). Use to resolve the connected account\'s own user ID for assignee or collaborator workflows, or to read the user timezone before scheduling. Takes no input; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const token = context.auth.access_token;
    assertNotNullOrUndefined(token, 'token');

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${API}/user`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    };

    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Todoist denied access to the user profile (insufficient scope).');
      }
      if (error.response?.status === 429) {
        throw new Error('Todoist rate limit hit. Retry after a short delay.');
      }
      throw error;
    }
  },
});
