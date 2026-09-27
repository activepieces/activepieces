import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTaskSearchOutputSchema } from '../../output-schemas';

const SUBTYPE_OPTIONS = [
  { label: 'Task', value: 'default_task' },
  { label: 'Milestone', value: 'milestone' },
  { label: 'Approval', value: 'approval' },
  { label: 'Custom task type', value: 'custom' },
];

const SORT_OPTIONS = [
  { label: 'Modified at (default)', value: 'modified_at' },
  { label: 'Created at', value: 'created_at' },
  { label: 'Due date', value: 'due_date' },
  { label: 'Completed at', value: 'completed_at' },
  { label: 'Likes', value: 'likes' },
  { label: 'Relevance', value: 'relevance' },
];

export const asanaSearchTasksAction = createAction({
  auth: asanaAuth,
  name: 'search_tasks',
  classification: 'SEARCH',
  displayName: 'Search Tasks',
  description: 'Search the tasks of an Asana workspace with advanced filters (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Runs Asana advanced search over a whole workspace: full text on task name and description, plus filters on assignee, projects, sections, tags, completion, blocked state and dates. Needs a paid (premium) Asana workspace or team; a free workspace gets a paid-plan error, so use List Project Tasks, List Assigned Tasks or Search Workspace Objects there instead. Results lag writes by 10 to 60 seconds, so do not use it to read back a task you just changed. There is no offset pagination: to page, sort by Created at ascending and pass the created_at of the last task you saw as Created After on the next call. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskSearchOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace to search. Obtain it from List Workspaces.',
      required: true,
    }),
    text: Property.ShortText({
      displayName: 'Text',
      description: 'Words to match in the task name and description. Leave empty to filter only.',
      required: false,
    }),
    resource_subtype: Property.StaticDropdown({
      displayName: 'Task Type',
      description: 'Only return tasks of this type. Leave empty for all types.',
      required: false,
      options: { disabled: false, options: SUBTYPE_OPTIONS },
    }),
    assignees: Property.Array({
      displayName: 'Assigned To (any of)',
      description: 'Users, any of whom may be the assignee: "me", an email address or a user gid.',
      required: false,
    }),
    projects: Property.Array({
      displayName: 'In Projects (any of)',
      description: 'Project gids; tasks in any of them (or inheriting them from a parent task) match. Obtain gids from List Projects.',
      required: false,
    }),
    sections: Property.Array({
      displayName: 'In Sections (any of)',
      description: 'Section gids; tasks in any of them match. Setting Projects as well also returns every task of those projects, so leave Projects empty to search inside sections only.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tagged With (any of)',
      description: 'Tag gids; tasks carrying any of them match. Obtain gids from List Tags.',
      required: false,
    }),
    completed: asanaProps.optionalBoolean({
      displayName: 'Completed',
      description: 'Yes for completed tasks only, No for incomplete tasks only. Leave empty for both.',
    }),
    is_blocked: asanaProps.optionalBoolean({
      displayName: 'Blocked',
      description: 'Yes for tasks that wait on incomplete dependencies, No for tasks that do not. Leave empty for both.',
    }),
    is_subtask: asanaProps.optionalBoolean({
      displayName: 'Subtask',
      description: 'Yes for subtasks only, No for top-level tasks only. Leave empty for both.',
    }),
    due_on_after: Property.ShortText({
      displayName: 'Due After',
      description: 'Only tasks due after this date, YYYY-MM-DD.',
      required: false,
    }),
    due_on_before: Property.ShortText({
      displayName: 'Due Before',
      description: 'Only tasks due before this date, YYYY-MM-DD.',
      required: false,
    }),
    modified_at_after: Property.ShortText({
      displayName: 'Modified After',
      description: 'Only tasks modified after this ISO 8601 date-time, which must end in Z or an offset, for example 2026-10-01T00:00:00Z.',
      required: false,
    }),
    created_at_after: Property.ShortText({
      displayName: 'Created After',
      description: 'Only tasks created after this ISO 8601 date-time (ending in Z or an offset). Use it with Sort By Created at, ascending, to fetch the next page.',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Result order. Leave empty for most recently modified first.',
      required: false,
      options: { disabled: false, options: SORT_OPTIONS },
    }),
    sort_ascending: asanaProps.optionalBoolean({
      displayName: 'Sort Ascending',
      description: 'Yes to sort oldest or smallest first. Leave empty for descending.',
    }),
    limit: asanaProps.limit({ noun: 'tasks' }),
  },
  async run(context) {
    const props = context.propsValue;
    const data = await asanaClient.asanaData<AsanaRecord[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/workspaces/${asanaUtils.pathSegment(props.workspace)}/tasks/search`,
      operation: 'Search Tasks',
      query: {
        text: asanaUtils.hasValue(props.text) ? props.text : undefined,
        resource_subtype: props.resource_subtype,
        'assignee.any': joinList(props.assignees),
        'projects.any': joinList(props.projects),
        'sections.any': joinList(props.sections),
        'tags.any': joinList(props.tags),
        completed: props.completed,
        is_blocked: props.is_blocked,
        is_subtask: props.is_subtask,
        'due_on.after': asanaUtils.hasValue(props.due_on_after) ? asanaUtils.assertDate({ value: String(props.due_on_after), field: 'Due After' }) : undefined,
        'due_on.before': asanaUtils.hasValue(props.due_on_before) ? asanaUtils.assertDate({ value: String(props.due_on_before), field: 'Due Before' }) : undefined,
        'modified_at.after': asanaUtils.hasValue(props.modified_at_after) ? asanaUtils.assertDateTime({ value: String(props.modified_at_after), field: 'Modified After' }) : undefined,
        'created_at.after': asanaUtils.hasValue(props.created_at_after) ? asanaUtils.assertDateTime({ value: String(props.created_at_after), field: 'Created After' }) : undefined,
        sort_by: props.sort_by,
        sort_ascending: props.sort_ascending,
        limit: asanaUtils.assertLimit(props.limit),
        opt_fields: ASANA_FIELDS.taskList,
      },
    });
    return { data: Array.isArray(data) ? data : [] };
  },
});

function joinList(value: unknown[] | undefined | null): string | undefined {
  const items = asanaUtils.toStringArray(value);
  return items.length === 0 ? undefined : items.join(',');
}
