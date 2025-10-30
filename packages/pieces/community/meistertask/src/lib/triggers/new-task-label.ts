import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getTaskLabels } from '../api';
import { projectDropdown, taskDropdown } from '../common/props';

export const newTaskLabelTrigger = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_task_label',
  displayName: 'New Task Label',
  description: 'Triggers when a task label is created',
  type: TriggerStrategy.POLLING,
  props: {
    project_id: projectDropdown,
    task_id: taskDropdown,
  },
  sampleData: {
    id: 12345,
    label_id: 67890,
    task_id: 54321,
    created_at: '2024-01-01T12:00:00Z',
  },
  async onEnable() {},
  async onDisable() {},
  async run({ auth, propsValue, store }) {
    const lastFetchTime = await store.get<number>('lastFetchTime') || 0;
    
    const taskLabels = await getTaskLabels(auth, propsValue.task_id);
    
    const newTaskLabels = taskLabels.filter((tl: any) => {
      if (!tl.created_at) return false;
      const createdAt = new Date(tl.created_at);
      return createdAt.getTime() > lastFetchTime;
    });

    if (newTaskLabels.length > 0) {
      const latestTime = Math.max(...newTaskLabels.map((tl: any) => new Date(tl.created_at).getTime()));
      await store.put('lastFetchTime', latestTime);
    }

    return newTaskLabels;
  },
});
