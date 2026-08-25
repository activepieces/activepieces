import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeCommon } from '../common';
import { buildProjectTasksPolling } from './common';

const polling = buildProjectTasksPolling('updated_at');

export const newOrUpdatedTask = createTrigger({
  auth: ninjapipeAuth,
  name: 'new_or_updated_task',
  displayName: 'New or Updated Task',
  description: 'Triggers when a task in the selected project is created or updated.',
  aiMetadata: {
    description: 'Fires whenever a task in the selected NinjaPipe project is created or has any field changed, detected by polling on the task last-updated timestamp. The event payload is the current state of the affected task, including its id, project_id, title, description, status, priority, assignee_id, due_date, parent_id, tags, and timestamps. A given task can fire this multiple times as it progresses (e.g. status moving to In Progress); the payload does not distinguish a first creation from a later update.',
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'a97381c8-75d3-4773-92d7-80ad97cf06f9',
    project_id: 'dbe92bb3-3239-4710-8216-dccc9ffceaa5',
    title: 'Ship release notes',
    description: null,
    status: 'In Progress',
    priority: 'Medium',
    assignee_id: null,
    due_date: null,
    parent_id: null,
    order_index: 0,
    tags: [],
    created_at: '2026-04-28T13:00:00Z',
    updated_at: '2026-04-28T13:30:00Z',
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
