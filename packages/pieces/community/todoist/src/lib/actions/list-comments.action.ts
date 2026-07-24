import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  assertNotNullOrUndefined,
  createAction,
  isNotUndefined,
  pickBy,
  Property,
} from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';

const API = 'https://api.todoist.com/api/v1';

type CommentsPage = {
  results: unknown[];
  next_cursor: string | null;
};

export const todoistListCommentsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_list_comments',
  displayName: 'List Comments',
  description: 'Lists all comments on a Todoist task or project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every comment on one Todoist task OR one project. Provide exactly one of task_id (resolve via Find Task) or project_id (resolve via List Projects) — not both. Use to read a comment thread or to resolve a comment_id before Get Comment. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        'The task whose comments to list (e.g. "6X4Vv2hfXjqWf3wj"). Provide this OR Project ID, not both.',
      required: false,
    }),
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'The project whose comments to list (e.g. "6X4Vv2hfXjqWf3wj"). Provide this OR Task ID, not both.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id, project_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    if ((task_id && project_id) || (!task_id && !project_id)) {
      throw new Error(
        'Provide exactly one of Task ID or Project ID (they are mutually exclusive).'
      );
    }

    const comments: unknown[] = [];
    let cursor: string | null = null;

    try {
      do {
        const queryParams = pickBy(
          { task_id, project_id, cursor: cursor ?? undefined },
          isNotUndefined
        );

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${API}/comments`,
          authentication: { type: AuthenticationType.BEARER_TOKEN, token },
          queryParams,
        };

        const response = await httpClient.sendRequest<CommentsPage>(request);
        comments.push(...response.body.results);
        cursor = response.body.next_cursor;
      } while (cursor);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(
          'Todoist task or project not found. Resolve the ID via Find Task or List Projects.'
        );
      }
      if (error.response?.status === 429) {
        throw new Error('Todoist rate limit hit. Retry after a short delay.');
      }
      throw error;
    }

    return { comments, count: comments.length };
  },
});
