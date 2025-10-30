import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getSections } from '../api';
import { projectDropdown } from '../common/props';

export const newSectionTrigger = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_section',
  displayName: 'New Section',
  description: 'Triggers when a new section is created',
  type: TriggerStrategy.POLLING,
  props: {
    project_id: projectDropdown,
  },
  sampleData: {
    id: 12345,
    name: 'To Do',
    created_at: '2024-01-01T12:00:00Z',
    project_id: 67890,
    sequence: 1,
  },
  async onEnable() {},
  async onDisable() {},
  async run({ auth, propsValue, store }) {
    const lastFetchTime = await store.get<number>('lastFetchTime') || 0;
    
    const sections = await getSections(auth, propsValue.project_id);
    
    const newSections = sections.filter((s: any) => {
      if (!s.created_at) return false;
      const createdAt = new Date(s.created_at);
      return createdAt.getTime() > lastFetchTime;
    });

    if (newSections.length > 0) {
      const latestTime = Math.max(...newSections.map((s: any) => new Date(s.created_at).getTime()));
      await store.put('lastFetchTime', latestTime);
    }

    return newSections;
  },
});
