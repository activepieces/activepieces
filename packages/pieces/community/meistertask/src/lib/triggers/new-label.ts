import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getLabels } from '../api';
import { projectDropdown } from '../common/props';

export const newLabelTrigger = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_label',
  displayName: 'New Label',
  description: 'Triggers when a label is created',
  type: TriggerStrategy.POLLING,
  props: {
    project_id: projectDropdown,
  },
  sampleData: {
    id: 12345,
    name: 'Important',
    color: '#d73502',
    created_at: '2024-01-01T12:00:00Z',
    project_id: 67890,
  },
  async onEnable() {},
  async onDisable() {},
  async run({ auth, propsValue, store }) {
    const lastFetchTime = await store.get<number>('lastFetchTime') || 0;
    
    const labels = await getLabels(auth, propsValue.project_id);
    
    const newLabels = labels.filter((l: any) => {
      if (!l.created_at) return false;
      const createdAt = new Date(l.created_at);
      return createdAt.getTime() > lastFetchTime;
    });

    if (newLabels.length > 0) {
      const latestTime = Math.max(...newLabels.map((l: any) => new Date(l.created_at).getTime()));
      await store.put('lastFetchTime', latestTime);
    }

    return newLabels;
  },
});
