import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, pollingHelper } from '@activepieces/pieces-common';
import { systemeioAuth } from '../auth';
import { SystemeioApiClient } from '../api-client';

const polling = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }: any) {
    const client = new SystemeioApiClient(auth.apiKey);
    const contacts = await client.getContacts({ order: 'desc', limit: 20 });
    // Flatten tags for each contact and emit each tag assignment as a separate event
    const items: any[] = [];
    // The API response is likely an AxiosResponse, so the data is in contacts.data
    const contactList = Array.isArray(contacts?.data?.items)
      ? contacts.data.items
      : Array.isArray(contacts?.data)
        ? contacts.data
        : [];
    contactList.forEach((c: any) => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach((tag: any) => {
          items.push({
            epochMilliSeconds: new Date(c.createdAt).getTime(),
            data: { contact: c, tag },
          });
        });
      }
    });
    return items;
  },
};

export const newTagAdded = createTrigger({
  auth: systemeioAuth,
  name: 'new_tag_added',
  displayName: 'New Tag Added to Contact',
  description: 'Fires when a specific tag is assigned to a contact.',
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