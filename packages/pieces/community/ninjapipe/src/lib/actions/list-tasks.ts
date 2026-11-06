import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeRecords } from '../common/records';
import { ninjapipeTasks } from '../common/task-props';
import { ninjapipeSchemas } from '../output-schemas';

export const listTasks = createAction({
  auth: ninjapipeAuth,
  name: 'list_tasks',
  classification: 'SEARCH',
  displayName: 'List Tasks',
  description: 'Lists every task of a project as a flat list. Use parent_id on each task to build a tree.',
  audience: 'human',
  aiMetadata: { description: 'List all tasks of a NinjaPipe project, with optional status, priority, parent and root-only filters. Read-only.', idempotent: true },
  outputSchema: ninjapipeSchemas.taskList,
  props: {
    projectId: ninjapipeProps.projectRequired(),
    statusFilter: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Only tasks with this status.', values: ninjapipeTasks.TASK_STATUSES }),
    priorityFilter: ninjapipeProps.staticDropdown({ displayName: 'Priority', description: 'Only tasks with this priority.', values: ninjapipeTasks.TASK_PRIORITIES }),
    parentId: Property.ShortText({ displayName: 'Parent Task ID', description: 'Only subtasks of this task.', required: false }),
    rootOnly: Property.Checkbox({ displayName: 'Root Tasks Only', description: 'Only top-level tasks (no subtasks). Ignored when Parent Task ID is set.', required: false, defaultValue: false }),
    sortBy: ninjapipeProps.staticDropdown({ displayName: 'Sort By', description: 'Default: created_at.', values: ['created_at', 'updated_at', 'due_date', 'title', 'priority', 'order_index'] }),
    sortOrder: ninjapipeProps.staticDropdown({ displayName: 'Sort Order', description: 'Default: desc.', values: ['desc', 'asc'] }),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeRecords.listUnpaged({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/projects/${ninjapipeClient.pathId({ value: p.projectId, field: 'Project' })}/tasks`,
      query: { status: p.statusFilter, priority: p.priorityFilter, parent_id: ninjapipeTasks.parentFilter({ parentId: p.parentId, rootOnly: p.rootOnly }), sort_by: p.sortBy, sort_order: p.sortOrder },
      operation: 'list tasks',
    });
  },
});
