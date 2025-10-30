import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getPersons } from '../api';
import { projectDropdown } from '../common/props';

export const newPersonTrigger = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_person',
  displayName: 'New Person',
  description: 'Triggers when a new person is added to a project',
  type: TriggerStrategy.POLLING,
  props: {
    project_id: projectDropdown,
  },
  sampleData: {
    id: 12345,
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
    created_at: '2024-01-01T12:00:00Z',
    project_id: 67890,
  },
  async onEnable() {},
  async onDisable() {},
  async run({ auth, propsValue, store }) {
    const lastFetchTime = await store.get<number>('lastFetchTime') || 0;
    
    const persons = await getPersons(auth, propsValue.project_id);
    
    const newPersons = persons.filter((p: any) => {
      if (!p.created_at) return false;
      const createdAt = new Date(p.created_at);
      return createdAt.getTime() > lastFetchTime;
    });

    if (newPersons.length > 0) {
      const latestTime = Math.max(...newPersons.map((p: any) => new Date(p.created_at).getTime()));
      await store.put('lastFetchTime', latestTime);
    }

    return newPersons;
  },
});
