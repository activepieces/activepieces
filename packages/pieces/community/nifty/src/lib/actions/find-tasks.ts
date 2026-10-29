import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyClient } from '../common/client';
import { findTasksOutputSchema } from '../output-schemas';

export const findTasks = createAction({
  auth: niftyAuth,
  name: 'find_tasks',
  displayName: 'Find Tasks',
  description: 'List tasks filtered by project, status, milestone, assignee, completion or due date, one page at a time.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Nifty tasks filtered by project, status, milestone/list, assignee, completion and a due-date window, one page at a time (pass next_offset to continue while has_more is true). Subtasks are only included when a project_id is given. Use to locate a task_id before updating, completing or deleting. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', required: false }),
    status_id: Property.ShortText({ displayName: 'Status ID', required: false }),
    milestone_id: Property.ShortText({ displayName: 'Milestone or List ID', required: false }),
    assignee_id: Property.ShortText({ displayName: 'Assignee Member ID', required: false }),
    completion: Property.StaticDropdown({
      displayName: 'Completion',
      required: false,
      defaultValue: 'any',
      options: {
        options: [
          { label: 'Any', value: 'any' },
          { label: 'Open only', value: 'open' },
          { label: 'Completed only', value: 'completed' },
        ],
      },
    }),
    include_subtasks: Property.Checkbox({
      displayName: 'Include Subtasks',
      description: 'Only works together with a Project ID.',
      required: false,
      defaultValue: false,
    }),
    include_archived: Property.Checkbox({ displayName: 'Include Archived', required: false, defaultValue: false }),
    due_from: Property.DateTime({ displayName: 'Due From', description: 'Set together with Due To.', required: false }),
    due_to: Property.DateTime({ displayName: 'Due To', description: 'Set together with Due From.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 1000. Default 100.', required: false, defaultValue: 100 }),
    offset: Property.Number({ displayName: 'Offset', description: 'Use next_offset from the previous page.', required: false, defaultValue: 0 }),
  },
  outputSchema: findTasksOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const projectId = niftyClient.optionalId({ value: p.project_id, label: 'Project ID' });
    const dueFrom = niftyClient.optionalIsoDate({ value: p.due_from, label: 'Due From' });
    const dueTo = niftyClient.optionalIsoDate({ value: p.due_to, label: 'Due To' });
    if ((dueFrom === undefined) !== (dueTo === undefined)) {
      throw new Error('Set both Due From and Due To, or neither. Nifty ignores a one-sided due-date window.');
    }
    if (p.include_subtasks === true && projectId === undefined) {
      throw new Error('Include Subtasks needs a Project ID: Nifty only returns subtasks for one project at a time.');
    }
    const limit = niftyClient.optionalNumber({ value: p.limit, label: 'Limit', min: 1, max: 1000, integer: true }) ?? 100;
    const offset = niftyClient.optionalNumber({ value: p.offset, label: 'Offset', min: 0, max: Number.MAX_SAFE_INTEGER, integer: true }) ?? 0;
    const completion = p.completion ?? 'any';
    if (completion !== 'any' && completion !== 'open' && completion !== 'completed') {
      throw new Error(`Completion must be any, open or completed, got "${String(completion)}".`);
    }
    const page = await niftyClient.listPage({
      auth: context.auth,
      path: 'tasks',
      key: 'tasks',
      limit,
      offset,
      query: {
        project_id: projectId,
        task_group_id: niftyClient.optionalId({ value: p.status_id, label: 'Status ID' }),
        milestone_id: niftyClient.optionalId({ value: p.milestone_id, label: 'Milestone ID' }),
        member_id: niftyClient.optionalId({ value: p.assignee_id, label: 'Assignee Member ID' }),
        completed: completion === 'any' ? undefined : completion === 'completed',
        include_subtasks: p.include_subtasks === true ? true : undefined,
        include_archived: p.include_archived === true ? true : undefined,
        from: dueFrom,
        to: dueTo,
      },
    });
    return {
      items: page.items,
      has_more: page.hasMore,
      next_offset: page.hasMore ? offset + page.items.length : null,
    };
  },
});
