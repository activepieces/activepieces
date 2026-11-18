import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';
import { ninjapipeFields } from '../../common/fields';
import { ninjapipeTasks } from '../../common/task-props';

export const aiUpdateTask = createAction({
  auth: ninjapipeAuth,
  name: 'ai_update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Updates a task in a project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Change a task by project_id and task_id (from ai_list_tasks): title, description, status (e.g. Done to complete it), priority, assignee_id or due_date. Only the fields you give change; clear_fields empties them. Repeating the same call gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.task,
  props: {
    project_id: ninjapipeAiProps.id({ displayName: 'Project ID', description: 'Project UUID from ai_list_projects.' }),
    task_id: ninjapipeAiProps.id({ displayName: 'Task ID', description: 'Task UUID from ai_list_tasks.' }),
    title: ninjapipeAiProps.text({ displayName: 'Title', description: 'New title.' }),
    description: ninjapipeAiProps.text({ displayName: 'Description', description: 'New details.' }),
    status: ninjapipeAiProps.choice({ displayName: 'Status', description: 'New status.', values: ninjapipeTasks.TASK_STATUSES }),
    priority: ninjapipeAiProps.choice({ displayName: 'Priority', description: 'New priority.', values: ninjapipeTasks.TASK_PRIORITIES }),
    assignee_id: ninjapipeAiProps.optionalId({ displayName: 'Assignee ID', description: 'account_id from ai_list_workspace_members.' }),
    due_date: ninjapipeAiProps.text({ displayName: 'Due Date', description: 'YYYY-MM-DD.' }),
    clear_fields: ninjapipeAiProps.clearFields({ fields: ['description', 'assignee_id', 'due_date', 'parent_id'] }),
  },
  async run(context) {
    const p = context.propsValue;
    const path = `/projects/${ninjapipeClient.pathId({ value: p.project_id, field: 'Project ID' })}/tasks/${ninjapipeClient.pathId({ value: p.task_id, field: 'Task ID' })}`;
    const changes = ninjapipeFields.compact({
      title: p.title,
      description: p.description,
      status: p.status,
      priority: p.priority,
      assignee_id: p.assignee_id,
      due_date: ninjapipeFields.toDateOnly({ value: p.due_date, field: 'Due Date' }),
    });
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clear_fields }), what: 'task' });
    return ninjapipeClient.sendRecord({ auth: ninjapipeClient.readAuth(context.auth), method: HttpMethod.PUT, path, body, operation: 'update task' });
  },
});
