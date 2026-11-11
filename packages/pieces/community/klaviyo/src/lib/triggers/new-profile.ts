import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
import { klaviyoApi } from '../common/client';
import { klaviyoInputs } from '../common/ai-props';
import { klaviyoOutputSchemas } from '../common/output-schemas';

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'newProfile',
  classification: 'READ',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo.',
  aiMetadata: {
    description: 'Fires when a new profile (contact) is created in the Klaviyo account, polling for profiles by their created timestamp. Each event represents one newly added profile across the whole account, regardless of list or segment membership.',
  },
  props: {},
  outputSchema: klaviyoOutputSchemas.triggerProfile,
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
});

const POLL_CAP = 500;

const polling: Polling<KlaviyoAuthValue, Record<string, unknown>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const since = lastFetchEpochMS
      ? new Date(lastFetchEpochMS).toISOString()
      : dayjs().subtract(24, 'hours').toISOString();
    const profiles = await klaviyoApi.pollAfter({ auth, path: '/profiles', field: 'created', since, cap: POLL_CAP });
    return profiles.map((profile) => ({
      epochMilliSeconds: dayjs(String(profile.attributes['created'])).valueOf(),
      data: klaviyoInputs.triggerProfile(profile),
    }));
  },
};
