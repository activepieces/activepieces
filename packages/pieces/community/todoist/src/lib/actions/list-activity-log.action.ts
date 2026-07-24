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

type ActivityPage = {
  results: unknown[];
  next_cursor: string | null;
};

export const todoistListActivityLogAction = createAction({
  auth: todoistAuth,
  name: 'todoist_list_activity_log',
  displayName: 'List Activity Log',
  description: 'Retrieves the Todoist activity (event) history.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieves the Todoist activity log — the history of events (added, updated, completed, deleted) across projects, tasks, and comments. Use for audit or reporting; narrow with object_type, event_type, a project/task scope, or a date range. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    object_type: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Restrict to one object type. One of: "project", "item" (task), "note" (comment).',
      required: false,
      options: {
        options: [
          { label: 'Project', value: 'project' },
          { label: 'Task (item)', value: 'item' },
          { label: 'Comment (note)', value: 'note' },
        ],
      },
    }),
    event_type: Property.ShortText({
      displayName: 'Event Type',
      description:
        'Restrict to a single event type across all object types, e.g. "added", "updated", "completed", "deleted".',
      required: false,
    }),
    object_id: Property.ShortText({
      displayName: 'Object ID',
      description:
        'Restrict to one specific object. Must be paired with Object Type (e.g. a task ID with object_type "item").',
      required: false,
    }),
    parent_project_id: Property.ShortText({
      displayName: 'Parent Project ID',
      description:
        'Restrict to one project and all of its tasks and comments. Resolve the ID via List Projects.',
      required: false,
    }),
    parent_item_id: Property.ShortText({
      displayName: 'Parent Task ID',
      description: 'Restrict to one task and all of its comments. Resolve the ID via Find Task.',
      required: false,
    }),
    date_from: Property.ShortText({
      displayName: 'Date From',
      description:
        'Only events on or after this instant, ISO 8601 (e.g. "2026-01-01T00:00:00Z").',
      required: false,
    }),
    date_to: Property.ShortText({
      displayName: 'Date To',
      description:
        'Only events before this instant (exclusive), ISO 8601 (e.g. "2026-02-01T00:00:00Z").',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of events to return per page.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const {
      object_type,
      event_type,
      object_id,
      parent_project_id,
      parent_item_id,
      date_from,
      date_to,
      limit,
    } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    const events: unknown[] = [];
    let cursor: string | null = null;

    try {
      do {
        const queryParams = pickBy(
          {
            object_type,
            event_type,
            object_id,
            parent_project_id,
            parent_item_id,
            date_from,
            date_to,
            limit: limit !== undefined ? String(limit) : undefined,
            cursor: cursor ?? undefined,
          },
          isNotUndefined
        );

        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${API}/activities`,
          authentication: { type: AuthenticationType.BEARER_TOKEN, token },
          queryParams,
        };

        const response = await httpClient.sendRequest<ActivityPage>(request);
        events.push(...response.body.results);
        cursor = response.body.next_cursor;
      } while (cursor);
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Todoist denied access to the activity log (insufficient scope or plan).');
      }
      if (error.response?.status === 429) {
        throw new Error('Todoist rate limit hit. Retry after a short delay.');
      }
      throw error;
    }

    return { events, count: events.length };
  },
});
