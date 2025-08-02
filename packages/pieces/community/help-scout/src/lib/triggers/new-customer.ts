import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Customer } from '../common/types';

const polling: Polling<PiecePropValueSchema<typeof helpScoutAuth>, {}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const sinceDate = lastFetchEpochMS
      ? new Date(lastFetchEpochMS).toISOString()
      : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const queryParams = {
      modifiedSince: sinceDate,
      sortField: 'createdAt',
      sortOrder: 'desc',
    };

    const customers = await helpScoutCommon.getAllPages(
      auth,
      '/customers',
      queryParams
    );

    // Filter only newly created customers
    const items: { epochMilliSeconds: number; data: Customer }[] = [];
    for (const customer of customers) {
      const createdAt = new Date(customer.createdAt).getTime();
      if (!lastFetchEpochMS || createdAt > lastFetchEpochMS) {
        // Fetch full customer details including embedded data
        const fullCustomer = await helpScoutCommon.makeRequest(
          auth,
          'GET',
          `/customers/${customer.id}`,
          undefined,
          { embed: 'emails,phones,social,websites' }
        );
        items.push({
          epochMilliSeconds: createdAt,
          data: fullCustomer,
        });
      }
    }

    return items;
  },
};

export const newCustomer = createTrigger({
  auth: helpScoutAuth,
  name: 'new-customer',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is added in Help Scout',
  props: {},
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 12345,
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    gender: 'male',
    age: '30-39',
    organization: 'Acme Corp',
    jobTitle: 'Software Engineer',
    location: 'San Francisco, CA',
    timezone: 'America/Los_Angeles',
    language: 'en',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    background: 'VIP customer, high-value account',
    address: {
      lines: ['123 Main St', 'Suite 100'],
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US',
    },
    properties: {
      customField1: 'value1',
      customField2: 'value2',
    },
    _embedded: {
      emails: [
        {
          id: 1,
          value: 'john.doe@example.com',
          type: 'work',
        },
        {
          id: 2,
          value: 'john.personal@gmail.com',
          type: 'home',
        },
      ],
      phones: [
        {
          id: 1,
          value: '+1-555-123-4567',
          type: 'work',
        },
        {
          id: 2,
          value: '+1-555-987-6543',
          type: 'mobile',
        },
      ],
      social: [
        {
          id: 1,
          type: 'twitter',
          value: '@johndoe',
        },
        {
          id: 2,
          type: 'linkedin',
          value: 'linkedin.com/in/johndoe',
        },
      ],
      websites: [
        {
          id: 1,
          value: 'https://johndoe.com',
        },
      ],
    },
  },
});