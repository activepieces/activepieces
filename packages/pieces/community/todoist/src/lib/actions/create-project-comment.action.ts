import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { assertNotNullOrUndefined, createAction, Property } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';

const API = 'https://api.todoist.com/api/v1';

export const todoistCreateProjectCommentAction = createAction({
  auth: todoistAuth,
  name: 'todoist_create_project_comment',
  displayName: 'Create Project Comment',
  description: 'Adds a comment to a Todoist project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a comment to a specific Todoist project identified by project_id (resolve the ID via List Projects). Use for project-level comments; to comment on a single task instead use Create Task Comment. Each call appends a new comment, so retries create duplicates.',
    idempotent: false,
  },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description:
        'The ID of the project to comment on (e.g. "6X4Vv2hfXjqWf3wj"). Obtain it from List Projects.',
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
    const { project_id, content, attachment } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(project_id, 'project_id');
    assertNotNullOrUndefined(content, 'content');

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${API}/comments`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      body: {
        project_id,
        content,
        attachment: attachment ?? undefined,
      },
    };

    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Todoist project '${project_id}' not found. Resolve the ID via List Projects.`);
      }
      if (error.response?.status === 403) {
        throw new Error('Todoist denied access to this project (insufficient permission or scope).');
      }
      if (error.response?.status === 429) {
        throw new Error('Todoist rate limit hit. Retry after a short delay.');
      }
      throw error;
    }
  },
});
