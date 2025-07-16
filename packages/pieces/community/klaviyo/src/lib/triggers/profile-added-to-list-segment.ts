
import { 
  createTrigger, 
  TriggerStrategy, 
  Property, 
  PiecePropValueSchema, 
  StaticPropsValue,
  OAuth2PropertyValue 
} from '@activepieces/pieces-framework';
import { 
  DedupeStrategy, 
  HttpMethod, 
  Polling, 
  pollingHelper 
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { klaviyoAuth } from '../common/auth';
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
    created: string;
    updated: string;
    last_event_date?: string;
    location?: object;
    properties?: object;
  };
  relationships?: object;
  links?: object;
}

const props = {
  targetType: Property.StaticDropdown({
    displayName: 'Target Type',
    description: 'Monitor a list or segment for new profile additions',
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
    description: 'Select the list to monitor for new profile additions',
    required: false,
    refreshers: ['auth', 'targetType'],
    options: async ({ auth, targetType }) => {
      if ((targetType as unknown as string) !== 'list') {
        return {
          disabled: true,
          options: [],
        };
      }
      
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account',
          options: [],
        };
      }

      try {
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const lists = await makeRequest(authProp.access_token, HttpMethod.GET, '/lists', {});
        
        const options = (lists.data || []).map((list: any) => ({
          label: list.attributes.name || list.id,
          value: list.id,
        }));

        return {
          disabled: false,
          options: options,
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Error loading lists',
          options: [],
        };
      }
    },
  }),
  segmentId: Property.Dropdown({
    displayName: 'Segment',
    description: 'Select the segment to monitor for new profile additions',
    required: false,
    refreshers: ['auth', 'targetType'],
    options: async ({ auth, targetType }) => {
      if ((targetType as unknown as string) !== 'segment') {
        return {
          disabled: true,
          options: [],
        };
      }
      
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your account',
          options: [],
        };
      }

      try {
        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
        const segments = await makeRequest(authProp.access_token, HttpMethod.GET, '/segments', {});
        
        const options = (segments.data || []).map((segment: any) => ({
          label: segment.attributes.name || segment.id,
          value: segment.id,
        }));

        return {
          disabled: false,
          options: options,
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Error loading segments',
          options: [],
        };
      }
    },
  }),
};

const polling: Polling<PiecePropValueSchema<typeof klaviyoAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS, store }) => {
    const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
    
    try {
      if (propsValue.targetType === 'list' && !propsValue.listId) {
        throw new Error('List ID is required when monitoring a list');
      }
      if (propsValue.targetType === 'segment' && !propsValue.segmentId) {
        throw new Error('Segment ID is required when monitoring a segment');
      }

      const targetId = propsValue.targetType === 'list' ? propsValue.listId : propsValue.segmentId;
      const targetName = propsValue.targetType === 'list' ? 'list' : 'segment';
      
      const basePath = propsValue.targetType === 'list' 
        ? `/lists/${targetId}/profiles`
        : `/segments/${targetId}/profiles`;

      const queryParams = new URLSearchParams();
      queryParams.append('page[size]', '100');
      queryParams.append('sort', 'created');

      const response = await makeRequest(
        authProp.access_token,
        HttpMethod.GET,
        `${basePath}?${queryParams.toString()}`
      );

      const profiles: KlaviyoProfile[] = response.data || [];
      
      let allProfiles = [...profiles];
      let nextCursor = response.links?.next;
      
      while (nextCursor && allProfiles.length < 1000) {
        try {
          const cursorMatch = nextCursor.match(/page%5Bcursor%5D=([^&]+)/);
          if (!cursorMatch) break;
          
          const cursor = decodeURIComponent(cursorMatch[1]);
          const paginationParams = new URLSearchParams();
          paginationParams.append('page[size]', '100');
          paginationParams.append('page[cursor]', cursor);
          paginationParams.append('sort', 'created');
          
          const pageResponse = await makeRequest(
            authProp.access_token,
            HttpMethod.GET,
            `${basePath}?${paginationParams.toString()}`
          );
          
          const pageProfiles: KlaviyoProfile[] = pageResponse.data || [];
          allProfiles.push(...pageProfiles);
          nextCursor = pageResponse.links?.next;
        } catch (error) {
          console.warn('Error fetching additional pages:', error);
          break;
        }
      }

      const storeKey = `klaviyo_${targetName}_${targetId}_profiles`;
      const lastProfileIds = (await store.get(storeKey)) as string[] || [];
      
      const currentProfileIds = allProfiles.map(p => p.id);
      
      const newProfileIds = currentProfileIds.filter(id => !lastProfileIds.includes(id));
      
      await store.put(storeKey, currentProfileIds);
      
      const newProfiles = allProfiles.filter(p => newProfileIds.includes(p.id));
      
      if (lastProfileIds.length === 0 && lastFetchEpochMS) {
        const since = dayjs().subtract(24, 'hours');
        const recentProfiles = newProfiles.filter(p => 
          dayjs(p.attributes.created).isAfter(since)
        );
        
        console.log(`Initial run: found ${newProfiles.length} total profiles, ${recentProfiles.length} recent additions`);
        
        return recentProfiles.map((profile) => ({
          epochMilliSeconds: dayjs(profile.attributes.created).valueOf(),
          data: {
            ...profile,
            profile_id: profile.id,
            email: profile.attributes.email,
            phone_number: profile.attributes.phone_number,
            first_name: profile.attributes.first_name,
            last_name: profile.attributes.last_name,
            full_name: [profile.attributes.first_name, profile.attributes.last_name]
              .filter(Boolean)
              .join(' ') || null,
            created_at: profile.attributes.created,
            updated_at: profile.attributes.updated,
            target_type: propsValue.targetType,
            target_id: targetId,
            added_to: `${targetName} ${targetId}`,
          },
        }));
      }

      console.log(`Found ${newProfiles.length} new profiles added to ${targetName} ${targetId}`);
      
      return newProfiles.map((profile) => ({
        epochMilliSeconds: Date.now(),
        data: {
          ...profile,
          profile_id: profile.id,
          email: profile.attributes.email,
          phone_number: profile.attributes.phone_number,
          first_name: profile.attributes.first_name,
          last_name: profile.attributes.last_name,
          full_name: [profile.attributes.first_name, profile.attributes.last_name]
            .filter(Boolean)
            .join(' ') || null,
          created_at: profile.attributes.created,
          updated_at: profile.attributes.updated,
          target_type: propsValue.targetType,
          target_id: targetId,
          added_to: `${targetName} ${targetId}`,
          detected_at: new Date().toISOString(),
        },
      }));
    } catch (error) {
      console.error('Error fetching profiles from list/segment:', error);
      throw new Error(`Failed to fetch profiles from ${propsValue.targetType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const profileAddedToListOrSegmentTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list_or_segment',
  displayName: 'Profile Added to List/Segment',
  description: 'Triggers when a profile is added to a specific list or segment.',
  props,
  sampleData: {
    type: "profile",
    id: "01JZTTZ2NNC8ZCP45SM4J84RG2",
    attributes: {
      email: "sarah.mason@klaviyo-demo.com",
      phone_number: "+15005550006",
      external_id: null,
      first_name: "Sarah",
      last_name: "Mason",
      organization: null,
      locale: null,
      title: "Regional Manager",
      image: null,
      created: "2025-07-10T18:53:32+00:00",
      updated: "2025-07-10T18:53:32+00:00",
      last_event_date: null,
      location: {
        zip: null,
        country: null,
        address1: null,
        address2: null,
        city: null,
        latitude: null,
        region: null,
        longitude: null,
        timezone: null,
        ip: null
      },
      properties: {
        "$phone_number_region": "US"
      }
    },
    relationships: {
      lists: {
        links: {
          self: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/relationships/lists/",
          related: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/lists/"
        }
      },
      segments: {
        links: {
          self: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/relationships/segments/",
          related: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/segments/"
        }
      }
    },
    links: {
      self: "https://a.klaviyo.com/api/profiles/01JZTTZ2NNC8ZCP45SM4J84RG2/"
    },
    profile_id: "01JZTTZ2NNC8ZCP45SM4J84RG2",
    email: "sarah.mason@klaviyo-demo.com",
    phone_number: "+15005550006",
    first_name: "Sarah",
    last_name: "Mason",
    full_name: "Sarah Mason",
    created_at: "2025-07-10T18:53:32+00:00",
    updated_at: "2025-07-10T18:53:32+00:00",
    target_type: "list",
    target_id: "RB89mt",
    added_to: "list RB89mt",
    detected_at: "2025-01-16T15:30:00Z"
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
      propsValue: context.propsValue as StaticPropsValue<typeof props>,
      files: context.files,
    });
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
      propsValue: context.propsValue as StaticPropsValue<typeof props>,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
      propsValue: context.propsValue as StaticPropsValue<typeof props>,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
      propsValue: context.propsValue as StaticPropsValue<typeof props>,
      files: context.files,
    });
  },
});