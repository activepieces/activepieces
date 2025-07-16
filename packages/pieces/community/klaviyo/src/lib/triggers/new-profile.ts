
import { 
  createTrigger, 
  TriggerStrategy, 
  PiecePropValueSchema, 
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

const polling: Polling<PiecePropValueSchema<typeof klaviyoAuth>, Record<string, unknown>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
    
    try {
      const since = lastFetchEpochMS 
        ? new Date(lastFetchEpochMS).toISOString()
        : dayjs().subtract(24, 'hours').toISOString();

      const queryParams = new URLSearchParams();
      queryParams.append('filter', `greater-than(created,${since})`);
      queryParams.append('page[size]', '100');
      queryParams.append('sort', 'created');
      

      const response = await makeRequest(
        authProp.access_token,
        HttpMethod.GET,
        `/profiles?${queryParams.toString()}`
      );

      const profiles: KlaviyoProfile[] = response.data || [];
      
      let allProfiles = [...profiles];
      let nextCursor = response.links?.next;
      
      while (nextCursor && allProfiles.length < 500) {
        try {
          const cursorMatch = nextCursor.match(/page%5Bcursor%5D=([^&]+)/);
          if (!cursorMatch) break;
          
          const cursor = decodeURIComponent(cursorMatch[1]);
          const paginationParams = new URLSearchParams();
          paginationParams.append('filter', `greater-than(created,${since})`);
          paginationParams.append('page[size]', '100');
          paginationParams.append('page[cursor]', cursor);
          paginationParams.append('sort', 'created');
          
          const pageResponse = await makeRequest(
            authProp.access_token,
            HttpMethod.GET,
            `/profiles?${paginationParams.toString()}`
          );
          
          const pageProfiles: KlaviyoProfile[] = pageResponse.data || [];
          allProfiles.push(...pageProfiles);
          nextCursor = pageResponse.links?.next;
        } catch (error) {
          console.warn('Error fetching additional pages:', error);
          break;
        }
      }

      return allProfiles.map((profile) => ({
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
        },
      }));
    } catch (error) {
      console.error('Error fetching new profiles:', error);
      throw new Error(`Failed to fetch new profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'newProfile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created.',
  props: {},
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
    // Additional convenient fields for trigger usage
    profile_id: "01JZTTZ2NNC8ZCP45SM4J84RG2",
    email: "sarah.mason@klaviyo-demo.com",
    phone_number: "+15005550006",
    first_name: "Sarah",
    last_name: "Mason",
    full_name: "Sarah Mason",
    created_at: "2025-07-10T18:53:32+00:00",
    updated_at: "2025-07-10T18:53:32+00:00"
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth as PiecePropValueSchema<typeof klaviyoAuth>,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});