import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { assertNotNullOrUndefined, createAction, Property } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';

const API = 'https://api.todoist.com/api/v1';

export const todoistCreateTaskCommentAction = createAction({
  auth: todoistAuth,
  name: 'todoist_create_task_comment',
  displayName: 'Create Task Comment',
  description: 'Adds a comment to a Todoist task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a comment to a specific Todoist task identified by task_id (resolve the ID via Find Task or List Tasks). Use for task-level comments; to comment on a project instead use Create Project Comment. Each call appends a new comment, so retries create duplicates.',
    idempotent: false,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        'The ID of the task to comment on (e.g. "6X4Vv2hfXjqWf3wj"). Obtain it from Find Task or List Tasks.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description:
        'The comment text, 1 to 15000 characters. May contain markdown-formatted text and hyperlinks.',
      required: true,
    }),
    attachment: Property.Object({
      displayName: 'Attachment',
      description:
        'Optional pre-formed attachment object (e.g. { "resource_type": "file", "file_url": "https://...", "file_name": "doc.pdf", "file_type": "application/pdf" }).',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id, content, attachment } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(task_id, 'task_id');
    assertNotNullOrUndefined(content, 'content');

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${API}/comments`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      body: {
        task_id,
        content,
        attachment: attachment ?? undefined,
      },
    };

    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Todoist task '${task_id}' not found. Resolve the ID via Find Task.`);
      }
      if (error.response?.status === 403) {
        throw new Error('Todoist denied access to this task (insufficient permission or scope).');
      }
      if (error.response?.status === 429) {
        throw new Error('Todoist rate limit hit. Retry after a short delay.');
      }
      throw error;
    }
  },
});
