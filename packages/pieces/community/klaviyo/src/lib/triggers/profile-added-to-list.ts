import { createTrigger, Property } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface Props {
  list_id?: string;
  segment_id?: string;
}

const polling: Polling<string, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { list_id, segment_id } = propsValue;

    if (!list_id && !segment_id) {
      throw new Error('Either list_id or segment_id is required');
    }

    const isTest = lastFetchEpochMS === 0;
    const lastFetchTime = new Date(lastFetchEpochMS).toISOString();

    // Determine endpoint based on whether we're checking a list or segment
    const resourceType = list_id ? 'lists' : 'segments';
    const resourceId = list_id || segment_id;

    const queryParams: Record<string, string> = {
      'sort': '-joined_group_at',
      'page[size]': isTest ? '10' : '100',
    };

    // Filter by profiles that joined after last fetch (if not a test)
    if (!isTest) {
      queryParams['filter'] = `greater-than(joined_group_at,${lastFetchTime})`;
    }

    const response = await klaviyoApiRequest(
      auth,
      HttpMethod.GET,
      `/${resourceType}/${resourceId}/profiles/`,
      undefined,
      queryParams
    );

    const items = response.data || [];

    return items.map((item: any) => {
      // Use joined_group_at if available, otherwise use created timestamp
      const joinedTimestamp = item.attributes.joined_group_at 
        ? new Date(item.attributes.joined_group_at).valueOf()
        : item.attributes.created 
        ? new Date(item.attributes.created).valueOf()
        : Date.now();
      
      return {
        epochMilliSeconds: joinedTimestamp,
        data: {
          ...item,
          list_id,
          segment_id,
          resource_type: resourceType,
        },
      };
    });
  },
};

export const profileAddedToListTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'profile-added-to-list',
  displayName: 'Profile Added to List/Segment',
  description: 'Triggers when a profile is added to a specific list or segment in Klaviyo',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to monitor (leave empty if using segment)',
      required: false,
    }),
    segment_id: Property.ShortText({
      displayName: 'Segment ID',
      description: 'The ID of the segment to monitor (leave empty if using list)',
      required: false,
    }),
  },
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
      joined_group_at: '2024-02-16T12:30:00Z',
      location: {
        address1: '123 Main St',
        city: 'New York',
        country: 'US',
        region: 'NY',
        zip: '10001',
      },
      properties: {
        custom_field: 'custom_value',
      },
    },
    list_id: 'XYZ123',
    segment_id: null,
    resource_type: 'lists',
    links: {
      self: 'https://a.klaviyo.com/api/profiles/01HQRS5XKQM8D9T3B7NQWX5YZ1/',
    },
  },
});
