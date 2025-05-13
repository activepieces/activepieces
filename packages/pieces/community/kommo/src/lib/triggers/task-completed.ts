import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

type KommoTask = {
  id: number;
  text?: string;
  is_completed: boolean;
  [key: string]: unknown;
};

export const taskCompletedTrigger = createTrigger({
  auth: kommoAuth,
  name: 'task_completed',
  displayName: 'Task Completed',
  description: 'Triggered when a task is marked as completed.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 555555,
    text: 'Follow-up Call',
    is_completed: true,
  },
  async onEnable() {
    // Required for polling triggers — no setup needed at this time
  },
  async onDisable() {
    // Required for polling triggers — no cleanup needed at this time
  },
  async run(context) {
    const { subdomain, apiToken } = context.auth as { subdomain: string; apiToken: string };

    const tasks = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.GET,
      `/tasks?filter[is_completed]=1&order=updated_at_desc`
    );

    const completedTasks = tasks._embedded.tasks as KommoTask[];

    return completedTasks.map((task) => ({
      id: task.id.toString(),
      data: task,
    }));
  },
});
