import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTaskOutputSchema } from '../../output-schemas';

export const asanaUpdateTaskAction = createAction({
  auth: asanaAuth,
  name: 'update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Change fields of an existing Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the task fields you set (name, description, assignee, due date or due time, start date, completed); everything else is left unchanged. Use it to complete or reopen a task too. Projects, tags, followers and parent are changed with their own actions (Add Task to Project, Add Tag to Task, Add Task Followers, Set Task Parent). Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task to update. Obtain it from List Project Tasks, List Assigned Tasks or Search Workspace Objects.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'New title of the task. Leave empty to keep the current name.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Description',
      description: 'New plain-text description; replaces the whole current description. Cannot be combined with HTML Description. Leave empty to keep it.',
      required: false,
    }),
    html_notes: Property.LongText({
      displayName: 'HTML Description',
      description: 'New rich-text description wrapped in <body>...</body>; replaces the whole current description. Cannot be combined with Description.',
      required: false,
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee',
      description: 'New assignee: "me", an email address or a user gid. Leave empty to keep the current assignee.',
      required: false,
    }),
    due_on: Property.ShortText({
      displayName: 'Due Date',
      description: 'New all-day due date in YYYY-MM-DD format. Cannot be combined with Due Date and Time.',
      required: false,
    }),
    due_at: Property.ShortText({
      displayName: 'Due Date and Time',
      description: 'New exact due moment as an ISO 8601 date-time that ends in Z (UTC) or a +hh:mm/-hh:mm offset, for example 2026-10-15T17:00:00Z or 2026-10-15T19:00:00+02:00; a value without an offset is rejected. Cannot be combined with Due Date.',
      required: false,
    }),
    start_on: Property.ShortText({
      displayName: 'Start Date',
      description: 'New start date in YYYY-MM-DD format. The task must have (or get) a due date.',
      required: false,
    }),
    completed: asanaProps.optionalBoolean({
      displayName: 'Completed',
      description: 'Yes marks the task complete, No reopens it. Leave empty to keep the current state.',
    }),
  },
  async run(context) {
    const { task, name, notes, html_notes, assignee, due_on, due_at, start_on, completed } = context.propsValue;
    asanaUtils.assertNotBoth({ first: notes, second: html_notes, firstLabel: 'Description', secondLabel: 'HTML Description' });
    asanaUtils.assertNotBoth({ first: due_on, second: due_at, firstLabel: 'Due Date', secondLabel: 'Due Date and Time' });
    const data: Record<string, unknown> = {
      ...(asanaUtils.hasValue(name) ? { name } : {}),
      ...(asanaUtils.hasValue(notes) ? { notes } : {}),
      ...(asanaUtils.hasValue(html_notes) ? { html_notes } : {}),
      ...(asanaUtils.hasValue(assignee) ? { assignee: String(assignee).trim() } : {}),
      ...(asanaUtils.hasValue(due_on) ? { due_on: asanaUtils.assertDate({ value: String(due_on), field: 'Due Date' }) } : {}),
      ...(asanaUtils.hasValue(due_at) ? { due_at: asanaUtils.assertDateTime({ value: String(due_at), field: 'Due Date and Time' }) } : {}),
      ...(asanaUtils.hasValue(start_on) ? { start_on: asanaUtils.assertDate({ value: String(start_on), field: 'Start Date' }) } : {}),
      ...(completed !== undefined && completed !== null ? { completed } : {}),
    };
    asanaUtils.assertNotEmpty({
      patch: data,
      fields: 'Task Name, Description, HTML Description, Assignee, Due Date, Due Date and Time, Start Date or Completed',
    });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/tasks/${asanaUtils.pathSegment(task)}`,
      operation: 'Update Task',
      query: { opt_fields: ASANA_FIELDS.task },
      data,
    });
  },
});
