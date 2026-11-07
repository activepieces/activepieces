import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../auth';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';
import { ninjapipePolling } from './common';

const polling = ninjapipePolling.buildProjectTasksPolling({ field: 'created_at' });

export const newTask = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_task',
  classification: 'READ',
  displayName: 'New Task',
  description: 'Triggers when a task is created in the selected project.',
  aiMetadata: {
    description:
      'Fires once for each task newly created in the selected NinjaPipe project, found by polling the project tasks by created_at. The payload is the task: id, project_id, title, description, status, priority, assignee_id, due_date, parent_id, tags and timestamps.',
  },
  type: TriggerStrategy.POLLING,
  outputSchema: ninjapipeSchemas.task,
  sampleData: {
    id: 'f6bc8683-31a9-46f2-9f3d-58a0a66f5e27',
    project_id: 'd9e0d794-e966-473e-bc7f-89d90e40d1aa',
    title: 'Ship release notes',
    description: null,
    status: 'To Do',
    priority: 'High',
    assignee_id: null,
    due_date: '2026-12-01',
    parent_id: null,
    level: 0,
    has_children: false,
    tags: [],
    created_at: '2026-10-25T15:34:47.050306+00:00',
    updated_at: '2026-10-25T15:34:47.050306+00:00',
  },
  props: {
    projectId: ninjapipeProps.projectRequired(),
  },
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});
