import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTaskOutputSchema } from '../../output-schemas';

export const asanaCreateProjectTaskAction = createAction({
  auth: asanaAuth,
  name: 'create_project_task',
  classification: 'WRITE',
  displayName: 'Create Project Task',
  description: 'Create a task in an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new top-level task in a project, with optional description, assignee, due date or due time, start date, followers and tags (by gid or exact name; an unknown tag name fails the call instead of being dropped). Use Create Subtask to add a task under another task. Each call creates a separate task, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaTaskOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace that owns the project, for example 1201234567890123. Obtain it from List Workspaces or Get Current User.',
      required: true,
    }),
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project to create the task in. Obtain it from List Projects or Search Workspace Objects (object type project).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      description: 'Short title of the task, for example "Draft launch email".',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Description',
      description: 'Plain-text description of the task. Cannot be combined with HTML Description.',
      required: false,
    }),
    html_notes: Property.LongText({
      displayName: 'HTML Description',
      description: 'Rich-text description in Asana rich text, wrapped in <body>...</body>, for example <body>See <strong>brief</strong></body>. Cannot be combined with Description.',
      required: false,
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee',
      description: 'User to assign: "me", an email address or a user gid.',
      required: false,
    }),
    due_on: Property.ShortText({
      displayName: 'Due Date',
      description: 'All-day due date in YYYY-MM-DD format, for example 2026-10-15. Cannot be combined with Due Date and Time.',
      required: false,
    }),
    due_at: Property.ShortText({
      displayName: 'Due Date and Time',
      description: 'Exact due moment as an ISO 8601 date-time that ends in Z (UTC) or a +hh:mm/-hh:mm offset, for example 2026-10-15T17:00:00Z or 2026-10-15T19:00:00+02:00; a value without an offset is rejected. Cannot be combined with Due Date.',
      required: false,
    }),
    start_on: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date in YYYY-MM-DD format. Asana requires a due date or due time when a start date is set.',
      required: false,
    }),
    followers: Property.Array({
      displayName: 'Followers',
      description: 'Users to add as followers, one per item: "me", an email address or a user gid.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply, one per item: a tag gid or the exact tag name in this workspace. Names are matched case-insensitively; an all-digit value is used as a gid when such a tag exists and is otherwise matched as a name; an unknown name fails the call. Create new tags first with Create Tag.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace, project, name, notes, html_notes, assignee, due_on, due_at, start_on, followers, tags } =
      context.propsValue;
    asanaUtils.assertNotBoth({ first: notes, second: html_notes, firstLabel: 'Description', secondLabel: 'HTML Description' });
    asanaUtils.assertNotBoth({ first: due_on, second: due_at, firstLabel: 'Due Date', secondLabel: 'Due Date and Time' });
    const followerList = asanaUtils.toStringArray(followers);
    const tagList = asanaUtils.toStringArray(tags);
    const data: Record<string, unknown> = {
      workspace: workspace.trim(),
      projects: [project.trim()],
      name,
      ...(asanaUtils.hasValue(notes) ? { notes } : {}),
      ...(asanaUtils.hasValue(html_notes) ? { html_notes } : {}),
      ...(asanaUtils.hasValue(assignee) ? { assignee: String(assignee).trim() } : {}),
      ...(asanaUtils.hasValue(due_on) ? { due_on: asanaUtils.assertDate({ value: String(due_on), field: 'Due Date' }) } : {}),
      ...(asanaUtils.hasValue(due_at) ? { due_at: asanaUtils.assertDateTime({ value: String(due_at), field: 'Due Date and Time' }) } : {}),
      ...(asanaUtils.hasValue(start_on) ? { start_on: asanaUtils.assertDate({ value: String(start_on), field: 'Start Date' }) } : {}),
      ...(followerList.length > 0 ? { followers: followerList } : {}),
    };
    if (tagList.length > 0) {
      data['tags'] = await asanaClient.resolveTagGids({ auth: context.auth, workspace: workspace.trim(), tags: tagList });
    }
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/tasks',
      operation: 'Create Project Task',
      query: { opt_fields: ASANA_FIELDS.task },
      data,
    });
  },
});
