import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, pollingHelper } from '@activepieces/pieces-common';
import { systemeioAuth } from '../auth';
import { SystemeioApiClient } from '../api-client';

const polling = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }: any) {
    const client = new SystemeioApiClient(auth.apiKey);
    const response = await client.getContacts({ order: 'desc', limit: 20 });
    const contacts = Array.isArray(response) ? response : (response.data?.items || response.data || []);
    return contacts.map((c: any) => ({
      epochMilliSeconds: new Date(c.createdAt).getTime(),
      data: c,
    }));
  },
};

export const newContact = createTrigger({
  auth: systemeioAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is created.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {},
  onEnable(context) {
    return pollingHelper.onEnable(polling, context);
  },
  onDisable(context) {
    return pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
}); 