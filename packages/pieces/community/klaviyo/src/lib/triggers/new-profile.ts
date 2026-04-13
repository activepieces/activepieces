import {
  createTrigger,
  TriggerStrategy,
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

const polling: Polling<KlaviyoAuthValue, Record<string, unknown>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const since = lastFetchEpochMS
      ? new Date(lastFetchEpochMS).toISOString()
      : dayjs().subtract(24, 'hours').toISOString();

    const allProfiles: KlaviyoProfile[] = [];

    const queryParams = new URLSearchParams();
    queryParams.append('filter', `greater-than(created,${since})`);
    queryParams.append('page[size]', '100');
    queryParams.append('sort', 'created');

    let response = await makeRequest(
      auth,
      HttpMethod.GET,
      `/profiles?${queryParams.toString()}`
    );

    allProfiles.push(...(response.data || []));

    while (response.links?.next && allProfiles.length < 500) {
      const cursorMatch = (response.links.next as string).match(/page%5Bcursor%5D=([^&]+)/);
      if (!cursorMatch) break;

      const cursor = decodeURIComponent(cursorMatch[1]);
      const pageParams = new URLSearchParams();
      pageParams.append('filter', `greater-than(created,${since})`);
      pageParams.append('page[size]', '100');
      pageParams.append('page[cursor]', cursor);
      pageParams.append('sort', 'created');

      response = await makeRequest(auth, HttpMethod.GET, `/profiles?${pageParams.toString()}`);
      allProfiles.push(...(response.data || []));
    }

    return allProfiles.map((profile) => {
      const loc = profile.attributes.location ?? {};
      return {
        epochMilliSeconds: dayjs(profile.attributes.created).valueOf(),
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
        },
      };
    });
  },
};

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'newProfile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo.',
  props: {},
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
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth as KlaviyoAuthValue,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth as KlaviyoAuthValue,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth as KlaviyoAuthValue,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth as KlaviyoAuthValue,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
