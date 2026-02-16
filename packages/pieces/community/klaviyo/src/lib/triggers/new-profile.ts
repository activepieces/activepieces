import { createTrigger, Property } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<string, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const currentTime = new Date().toISOString();
    const lastFetchTime = new Date(lastFetchEpochMS).toISOString();

    // For testing, get recent profiles
    const isTest = lastFetchEpochMS === 0;
    
    let filter = '';
    if (!isTest) {
      filter = `greater-than(created,${lastFetchTime})`;
    }

    const queryParams: Record<string, string> = {
      'sort': '-created',
      'page[size]': isTest ? '10' : '100',
    };

    if (filter) {
      queryParams['filter'] = filter;
    }

    const response = await klaviyoApiRequest(
      auth,
      HttpMethod.GET,
      '/profiles/',
      undefined,
      queryParams
    );

    const items = response.data || [];

    return items.map((item: any) => {
      const createdTimestamp = item.attributes.created 
        ? new Date(item.attributes.created).valueOf()
        : Date.now();
      
      return {
        epochMilliSeconds: createdTimestamp,
        data: item,
      };
    });
  },
};

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'new-profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo',
  props: {},
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    type: 'profile',
    id: '01HQRS5XKQM8D9T3B7NQWX5YZ1',
    attributes: {
      email: 'example@klaviyo.com',
      phone_number: '+12345678901',
      external_id: 'ext_12345',
      first_name: 'Jane',
      last_name: 'Doe',
      organization: 'Acme Corp',
      title: 'Marketing Manager',
      image: 'https://example.com/avatar.jpg',
      created: '2024-02-16T12:00:00Z',
      updated: '2024-02-16T12:00:00Z',
      last_event_date: '2024-02-16T12:00:00Z',
      location: {
        address1: '123 Main St',
        address2: 'Apt 4B',
        city: 'New York',
        country: 'US',
        region: 'NY',
        zip: '10001',
        timezone: 'America/New_York',
      },
      properties: {
        custom_field: 'custom_value',
      },
    },
    links: {
      self: 'https://a.klaviyo.com/api/profiles/01HQRS5XKQM8D9T3B7NQWX5YZ1/',
    },
  },
});
