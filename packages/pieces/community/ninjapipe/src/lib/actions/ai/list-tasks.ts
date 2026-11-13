import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';
import { ninjapipeRecords } from '../../common/records';
import { ninjapipeTasks } from '../../common/task-props';

export const aiListTasks = createAction({
  auth: ninjapipeAuth,
  name: 'ai_list_tasks',
  classification: 'SEARCH',
  displayName: 'List Tasks',
  description: 'Lists the tasks of a project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List every task of one NinjaPipe project (project_id from ai_list_projects), optionally only a status (To Do, In Progress, Done, Cancelled), a priority (High, Medium, Low) the subtasks of parent_id, or only top-level tasks with root_only. Returns all matching tasks in one call. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.taskList,
  props: {
    project_id: ninjapipeAiProps.id({ displayName: 'Project ID', description: 'Project UUID from ai_list_projects.' }),
    status: ninjapipeAiProps.choice({ displayName: 'Status', description: 'Only tasks with this status.', values: ninjapipeTasks.TASK_STATUSES }),
    priority: ninjapipeAiProps.choice({ displayName: 'Priority', description: 'Only tasks with this priority.', values: ninjapipeTasks.TASK_PRIORITIES }),
    parent_id: ninjapipeAiProps.optionalId({ displayName: 'Parent Task ID', description: 'Only subtasks of this task.' }),
    root_only: Property.Checkbox({ displayName: 'Root Tasks Only', description: 'true returns only top-level tasks (no subtasks). Ignored when parent_id is set.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeRecords.listUnpaged({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/projects/${ninjapipeClient.pathId({ value: p.project_id, field: 'Project ID' })}/tasks`,
      query: { status: p.status, priority: p.priority, parent_id: ninjapipeTasks.parentFilter({ parentId: p.parent_id, rootOnly: p.root_only }) },
      operation: 'list tasks',
    });
  },
});
