import {
  createTrigger,
  TriggerStrategy,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
import { makeRequest } from '../common/client';

interface KlaviyoProfile {
  type: string;
  id: string;
  attributes: {
    email?: string;
    phone_number?: string;
    external_id?: string;
    first_name?: string;
    last_name?: string;
    organization?: string;
    locale?: string;
    title?: string;
    image?: string;
    created: string;
    updated: string;
    last_event_date?: string;
    joined_group_at?: string;
    location?: {
      address1?: string;
      address2?: string;
      city?: string;
      country?: string;
      region?: string;
      zip?: string;
      timezone?: string;
      ip?: string;
      latitude?: number;
      longitude?: number;
    };
    properties?: object;
  };
}

const props = {
  targetType: Property.StaticDropdown({
    displayName: 'Target Type',
    description: 'Monitor a list or segment for new profile additions.',
    required: true,
    options: {
      options: [
        { label: 'List', value: 'list' },
        { label: 'Segment', value: 'segment' },
      ],
    },
  }),
  listId: Property.Dropdown({
    displayName: 'List',
    description: 'Select the list to monitor for new profile additions.',
    required: false,
    auth: klaviyoAuth,
    refreshers: ['auth', 'targetType'],
    options: async ({ auth, targetType }) => {
      if ((targetType as unknown as string) !== 'list') {
        return { disabled: true, options: [] };
      }
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your account', options: [] };
      }
      try {
        const lists = await makeRequest(auth as KlaviyoAuthValue, HttpMethod.GET, '/lists', {});
        return {
          disabled: false,
          options: (lists.data || []).map((list: any) => ({
            label: list.attributes.name || list.id,
            value: list.id,
          })),
        };
      } catch {
        return { disabled: true, placeholder: 'Error loading lists', options: [] };
      }
    },
  }),
  segmentId: Property.Dropdown({
    displayName: 'Segment',
    description: 'Select the segment to monitor for new profile additions.',
    required: false,
    auth: klaviyoAuth,
    refreshers: ['auth', 'targetType'],
    options: async ({ auth, targetType }) => {
      if ((targetType as unknown as string) !== 'segment') {
        return { disabled: true, options: [] };
      }
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your account', options: [] };
      }
      try {
        const segments = await makeRequest(auth as KlaviyoAuthValue, HttpMethod.GET, '/segments', {});
        return {
          disabled: false,
          options: (segments.data || []).map((segment: any) => ({
            label: segment.attributes.name || segment.id,
            value: segment.id,
          })),
        };
      } catch {
        return { disabled: true, placeholder: 'Error loading segments', options: [] };
      }
    },
  }),
};

const polling: Polling<KlaviyoAuthValue, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { targetType, listId, segmentId } = propsValue;

    if (targetType === 'list' && !listId) {
      throw new Error('Please select a list to monitor.');
    }
    if (targetType === 'segment' && !segmentId) {
      throw new Error('Please select a segment to monitor.');
    }

    const targetId = targetType === 'list' ? listId : segmentId;
    const basePath = targetType === 'list'
      ? `/lists/${targetId}/profiles`
      : `/segments/${targetId}/profiles`;

    // Use joined_group_at to only fetch profiles added since the last poll
    const since = lastFetchEpochMS
      ? new Date(lastFetchEpochMS).toISOString()
      : dayjs().subtract(24, 'hours').toISOString();

    const queryParams = new URLSearchParams();
    queryParams.append('filter', `greater-than(joined_group_at,${since})`);
    queryParams.append('page[size]', '100');
    queryParams.append('sort', 'joined_group_at');

    const allProfiles: KlaviyoProfile[] = [];

    let response = await makeRequest(
      auth,
      HttpMethod.GET,
      `${basePath}?${queryParams.toString()}`
    );

    allProfiles.push(...(response.data || []));

    // Paginate through remaining results
    while (response.links?.next && allProfiles.length < 1000) {
      const cursorMatch = (response.links.next as string).match(/page%5Bcursor%5D=([^&]+)/);
      if (!cursorMatch) break;

      const cursor = decodeURIComponent(cursorMatch[1]);
      const pageParams = new URLSearchParams();
      pageParams.append('filter', `greater-than(joined_group_at,${since})`);
      pageParams.append('page[size]', '100');
      pageParams.append('page[cursor]', cursor);
      pageParams.append('sort', 'joined_group_at');

      response = await makeRequest(auth, HttpMethod.GET, `${basePath}?${pageParams.toString()}`);
      allProfiles.push(...(response.data || []));
    }

    return allProfiles.map((profile) => {
      const loc = profile.attributes.location ?? {};
      return {
        epochMilliSeconds: dayjs(profile.attributes.joined_group_at ?? profile.attributes.created).valueOf(),
        data: {
          id: profile.id,
          email: profile.attributes.email ?? null,
          phone_number: profile.attributes.phone_number ?? null,
          external_id: profile.attributes.external_id ?? null,
          first_name: profile.attributes.first_name ?? null,
          last_name: profile.attributes.last_name ?? null,
          full_name: [profile.attributes.first_name, profile.attributes.last_name].filter(Boolean).join(' ') || null,
          organization: profile.attributes.organization ?? null,
          locale: profile.attributes.locale ?? null,
          title: profile.attributes.title ?? null,
          image: profile.attributes.image ?? null,
          created: profile.attributes.created,
          updated: profile.attributes.updated,
          joined_group_at: profile.attributes.joined_group_at ?? null,
          last_event_date: profile.attributes.last_event_date ?? null,
          address1: loc.address1 ?? null,
          address2: loc.address2 ?? null,
          city: loc.city ?? null,
          country: loc.country ?? null,
          region: loc.region ?? null,
          zip: loc.zip ?? null,
          timezone: loc.timezone ?? null,
          ip: loc.ip ?? null,
          latitude: loc.latitude ?? null,
          longitude: loc.longitude ?? null,
          target_type: targetType,
          target_id: targetId,
        },
      };
    });
  },
};

export const profileAddedToListOrSegmentTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list_or_segment',
  displayName: 'Profile Added to List/Segment',
  description: 'Triggers when a profile is added to a specific list or segment.',
  props,
  sampleData: {
    id: '01JZTTZ2NNC8ZCP45SM4J84RG2',
    email: 'sarah.mason@klaviyo-demo.com',
    phone_number: '+15005550006',
    external_id: null,
    first_name: 'Sarah',
    last_name: 'Mason',
    full_name: 'Sarah Mason',
    organization: null,
    locale: null,
    title: 'Regional Manager',
    image: null,
    created: '2025-07-10T18:53:32+00:00',
    updated: '2025-07-10T18:53:32+00:00',
    joined_group_at: '2025-07-16T10:00:00+00:00',
    last_event_date: null,
    address1: null,
    address2: null,
    city: null,
    country: null,
    region: null,
    zip: null,
    timezone: null,
    ip: null,
    latitude: null,
    longitude: null,
    target_type: 'list',
    target_id: 'RB89mt',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth as KlaviyoAuthValue,
      propsValue: context.propsValue as StaticPropsValue<typeof props>,
      files: context.files,
    });
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth as KlaviyoAuthValue,
      propsValue: context.propsValue as StaticPropsValue<typeof props>,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth as KlaviyoAuthValue,
      propsValue: context.propsValue as StaticPropsValue<typeof props>,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth as KlaviyoAuthValue,
      propsValue: context.propsValue as StaticPropsValue<typeof props>,
      files: context.files,
    });
  },
});
