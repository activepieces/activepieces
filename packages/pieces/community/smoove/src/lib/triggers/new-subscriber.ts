import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smooveAuth } from '../common/auth';
import { smooveApiCall } from '../common/client';

const LAST_CONTACT_ID_KEY = 'smoove-last-contact-id';

export const newSubscriberTrigger = createTrigger({
  auth: smooveAuth,
  name: 'new_subscriber',
  displayName: 'New Subscriber',
  description: 'Triggers when a new subscriber (contact) is added in Smoove.',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'How often to check for new subscribers.',
      required: false,
      defaultValue: '5',
      options: {
        disabled: false,
        options: [
          { label: 'Every 1 minute', value: '1' },
          { label: 'Every 5 minutes', value: '5' },
          { label: 'Every 15 minutes', value: '15' },
          { label: 'Every 30 minutes', value: '30' },
          { label: 'Every hour', value: '60' },
        ],
      },
    }),
  },

  async onEnable(context) {
    try {
      const response = await smooveApiCall<{ contacts: any[] }>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/Contacts`,
        query: { sort: '-id', limit: 1 },
      });
      const maxId = response.contacts?.[0]?.id;
      await context.store.put(LAST_CONTACT_ID_KEY, maxId || 0);
      console.log(`Initialized with last contact ID ${maxId}`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please check your API key.');
      }
      throw new Error(`Failed to initialize new subscriber polling: ${error.message}`);
    }
  },

  async onDisable() {
    console.log('Stopped polling for new subscribers');
  },

  async run(context) {
    const lastId = (await context.store.get<number>(LAST_CONTACT_ID_KEY)) || 0;

    try {
      const response = await smooveApiCall<{ contacts: any[] }>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/Contacts`,
        query: { sort: 'id', filter: `id>${lastId}` },
      });

      const newContacts = response.contacts || [];
      if (newContacts.length === 0) {
        return [];
      }

      const maxId = Math.max(...newContacts.map(c => c.id));
      await context.store.put(LAST_CONTACT_ID_KEY, maxId);

      return newContacts.map(c => ({
        id: String(c.id),
        email: c.email,
        cellPhone: c.cellPhone,
        firstName: c.firstName,
        lastName: c.lastName,
        status: c.status,
        raw: c,
        triggerInfo: {
          detectedAt: new Date().toISOString(),
          source: 'smoove',
          type: 'new_subscriber',
        },
      }));
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Please check your API key.');
      }
      throw new Error(`Polling failed: ${error.message}. Will retry.`);
    }
  },

  async test(context) {
    try {
      const response = await smooveApiCall<{ contacts: any[] }>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/Contacts`,
        query: { sort: '-id', limit: 1 },
      });
      const c = response.contacts?.[0];
      if (!c) throw new Error('No contacts found');
      return [{
        id: String(c.id),
        email: c.email,
        cellPhone: c.cellPhone,
        firstName: c.firstName,
        lastName: c.lastName,
        status: c.status,
        raw: c,
        triggerInfo: {
          detectedAt: new Date().toISOString(),
          source: 'smoove',
          type: 'new_subscriber',
        },
      }];
    } catch (error: any) {
      throw new Error(`Test failed: ${error.message}`);
    }
  },

  sampleData: {
    id: '12345',
    email: 'jane.doe@example.com',
    cellPhone: '+1234567890',
    firstName: 'Jane',
    lastName: 'Doe',
    status: 'subscribed',
    raw: {},
    triggerInfo: { detectedAt: new Date().toISOString(), source: 'smoove', type: 'new_subscriber' },
  },
});
