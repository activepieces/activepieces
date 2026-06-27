import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { assertNotNullOrUndefined, createAction, Property } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';

const API = 'https://api.todoist.com/api/v1';

export const todoistGetCommentAction = createAction({
  auth: todoistAuth,
  name: 'todoist_get_comment',
  displayName: 'Get Comment',
  description: 'Fetches a single Todoist comment by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches one Todoist comment by its comment_id (resolve the ID via List Comments). Use when you already have a comment ID and want its full record; to read every comment on a task or project use List Comments instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    comment_id: Property.ShortText({
      displayName: 'Comment ID',
      description:
        'The ID of the comment to retrieve (e.g. "2992679862"). Obtain it from List Comments.',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { comment_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(comment_id, 'comment_id');

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${API}/comments/${comment_id}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    };

    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Todoist comment '${comment_id}' not found. Resolve the ID via List Comments.`);
      }
      if (error.response?.status === 429) {
        throw new Error('Todoist rate limit hit. Retry after a short delay.');
      }
      throw error;
    }
  },
});
