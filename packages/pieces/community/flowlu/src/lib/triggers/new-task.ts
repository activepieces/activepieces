import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { flowluCommon } from '../common';
import { flowluAuth } from '../auth';
import { flowluPollingHooks } from '../common/polling-trigger';
import { flowluInput } from '../common/utils';
import { taskOutputSchema } from '../output-schemas';

export const newTaskTrigger = createTrigger({
  auth: flowluAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for each new Flowlu task created after the trigger was turned on, optionally only tasks that are assigned to one user or in one project when Flowlu is next polled. Tasks that existed before the trigger was turned on never fire, even if they are reassigned later. Each run carries one task record.',
  },
  props: {
    responsible_id: flowluCommon.user_id(false, 'Assignee'),
    project_id: flowluCommon.project_id(
      false,
      'Project',
      'Only tasks in this project.'
    ),
  },
  type: TriggerStrategy.POLLING,
  ...flowluPollingHooks({
    source: { module: 'task', entity: 'tasks' },
    filters: (props) => {
      const projectId = flowluInput.optionalId({
        value: props['project_id'],
        name: 'Project',
      });
      return {
        'filter[responsible_id]': flowluInput.optionalId({
          value: props['responsible_id'],
          name: 'Assignee',
        }),
        'filter[module]': projectId === undefined ? undefined : 'st',
        'filter[model]': projectId === undefined ? undefined : 'project',
        'filter[model_id]': projectId,
      };
    },
  }),
  outputSchema: taskOutputSchema,
  sampleData: {
    id: 103,
    name: 'AP-TEST-Task-AI',
    description: '',
    status: 5,
    priority: 3,
    type: 0,
    responsible_id: 1,
    owner_id: 0,
    plan_start_date: '2026-10-02 12:00:00',
    deadline: '2026-10-05 20:00:00',
    start_date: '2026-10-01 07:04:53',
    closed_date: '2026-10-01 07:04:53',
    workflow_id: 1,
    workflow_stage_id: 4,
    module: 'st',
    model: 'project',
    model_id: 3,
    crm_account_id: 18,
    parent_id: 0,
    deadline_allowchange: 1,
    task_checkbyowner: 0,
    time_estimate: 0,
    time_spent: 0,
    created_date: '2026-10-01 07:04:09',
    updated_date: '2026-10-01 07:04:53',
  },
});
