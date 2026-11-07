import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';
import { ninjapipeFields } from '../../common/fields';
import { ninjapipeTasks } from '../../common/task-props';

export const aiCreateTask = createAction({
  auth: ninjapipeAuth,
  name: 'ai_create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a task in a project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a task in a NinjaPipe project (project_id from ai_list_projects) with a title and optional description, status, priority, assignee_id (account_id from ai_list_workspace_members), due_date (YYYY-MM-DD) and parent_id for a subtask. Not idempotent: each call creates another task.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.task,
  props: {
    project_id: ninjapipeAiProps.id({ displayName: 'Project ID', description: 'Project UUID from ai_list_projects.' }),
    title: ninjapipeAiProps.text({ displayName: 'Title', description: 'Task title.', required: true }),
    description: ninjapipeAiProps.text({ displayName: 'Description', description: 'Task details.' }),
    status: ninjapipeAiProps.choice({ displayName: 'Status', description: 'Default To Do.', values: ninjapipeTasks.TASK_STATUSES }),
    priority: ninjapipeAiProps.choice({ displayName: 'Priority', description: 'Task priority.', values: ninjapipeTasks.TASK_PRIORITIES }),
    assignee_id: ninjapipeAiProps.optionalId({ displayName: 'Assignee ID', description: 'account_id from ai_list_workspace_members.' }),
    due_date: ninjapipeAiProps.text({ displayName: 'Due Date', description: 'YYYY-MM-DD.' }),
    parent_id: ninjapipeAiProps.optionalId({ displayName: 'Parent Task ID', description: 'Task UUID in the same project, to create a subtask.' }),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: `/projects/${ninjapipeClient.pathId({ value: p.project_id, field: 'Project ID' })}/tasks`,
      body: ninjapipeFields.compact({
        title: p.title,
        description: p.description,
        status: p.status,
        priority: p.priority,
        assignee_id: p.assignee_id,
        due_date: ninjapipeFields.toDateOnly({ value: p.due_date, field: 'Due Date' }),
        parent_id: p.parent_id,
      }),
      operation: 'create task',
    });
  },
});
