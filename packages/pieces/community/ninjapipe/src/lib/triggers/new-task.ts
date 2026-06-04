import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeCommon } from '../common';
import { buildProjectTasksPolling } from './common';

const polling = buildProjectTasksPolling('created_at');

export const newTask = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Triggers when a new task is created in the selected project.',
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'a97381c8-75d3-4773-92d7-80ad97cf06f9',
    project_id: 'dbe92bb3-3239-4710-8216-dccc9ffceaa5',
    title: 'Ship release notes',
    description: null,
    status: 'To Do',
    priority: 'Medium',
    assignee_id: null,
    due_date: null,
    parent_id: null,
    order_index: 0,
    tags: [],
    created_at: '2026-04-28T13:00:00Z',
    updated_at: '2026-04-28T13:00:00Z',
  },
  props: {
    projectId: ninjapipeCommon.projectDropdownRequired,
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
