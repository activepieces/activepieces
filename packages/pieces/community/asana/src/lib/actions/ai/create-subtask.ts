import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTaskOutputSchema } from '../../output-schemas';

export const asanaCreateSubtaskAction = createAction({
  auth: asanaAuth,
  name: 'create_subtask',
  classification: 'WRITE',
  displayName: 'Create Subtask',
  description: 'Create a subtask under an existing Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new subtask under a parent task, with optional description, assignee, due date or due time, start date and followers. Use Create Project Task for a top-level task in a project. Each call creates a separate subtask, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaTaskOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Parent Task GID',
      description: 'Gid of the task that will contain the subtask. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Subtask Name',
      description: 'Short title of the subtask, for example "Collect screenshots".',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Description',
      description: 'Plain-text description. Cannot be combined with HTML Description.',
      required: false,
    }),
    html_notes: Property.LongText({
      displayName: 'HTML Description',
      description: 'Rich-text description wrapped in <body>...</body>. Cannot be combined with Description.',
      required: false,
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee',
      description: 'User to assign: "me", an email address or a user gid.',
      required: false,
    }),
    due_on: Property.ShortText({
      displayName: 'Due Date',
      description: 'All-day due date in YYYY-MM-DD format. Cannot be combined with Due Date and Time.',
      required: false,
    }),
    due_at: Property.ShortText({
      displayName: 'Due Date and Time',
      description: 'Exact due moment as an ISO 8601 date-time that ends in Z (UTC) or a +hh:mm/-hh:mm offset, for example 2026-10-15T17:00:00Z or 2026-10-15T19:00:00+02:00; a value without an offset is rejected. Cannot be combined with Due Date.',
      required: false,
    }),
    start_on: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date in YYYY-MM-DD format. Requires a due date or due time.',
      required: false,
    }),
    followers: Property.Array({
      displayName: 'Followers',
      description: 'Users to add as followers, one per item: "me", an email address or a user gid.',
      required: false,
    }),
  },
  async run(context) {
    const { task, name, notes, html_notes, assignee, due_on, due_at, start_on, followers } = context.propsValue;
    asanaUtils.assertNotBoth({ first: notes, second: html_notes, firstLabel: 'Description', secondLabel: 'HTML Description' });
    asanaUtils.assertNotBoth({ first: due_on, second: due_at, firstLabel: 'Due Date', secondLabel: 'Due Date and Time' });
    const followerList = asanaUtils.toStringArray(followers);
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/subtasks`,
      operation: 'Create Subtask',
      query: { opt_fields: ASANA_FIELDS.task },
      data: {
        name,
        ...(asanaUtils.hasValue(notes) ? { notes } : {}),
        ...(asanaUtils.hasValue(html_notes) ? { html_notes } : {}),
        ...(asanaUtils.hasValue(assignee) ? { assignee: String(assignee).trim() } : {}),
        ...(asanaUtils.hasValue(due_on) ? { due_on: asanaUtils.assertDate({ value: String(due_on), field: 'Due Date' }) } : {}),
        ...(asanaUtils.hasValue(due_at) ? { due_at: asanaUtils.assertDateTime({ value: String(due_at), field: 'Due Date and Time' }) } : {}),
        ...(asanaUtils.hasValue(start_on) ? { start_on: asanaUtils.assertDate({ value: String(start_on), field: 'Start Date' }) } : {}),
        ...(followerList.length > 0 ? { followers: followerList } : {}),
      },
    });
  },
});
