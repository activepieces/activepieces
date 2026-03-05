import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { KLAVIYO_API_URL, KLAVIYO_API_REVISION } from '../common';

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'new_profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    type: 'profile',
    id: 'EXAMPLE_ID',
    attributes: {
      email: 'example@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      created: '2024-01-01T00:00:00+00:00',
    },
  },
  async onEnable(context) {
    const response = await httpClient.sendRequest<{
      data: Array<{ id: string; attributes: { created: string } }>;
    }>({
      method: HttpMethod.GET,
      url: `${KLAVIYO_API_URL}/profiles`,
      queryParams: {
        sort: '-created',
        'page[size]': '1',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      headers: {
        Accept: 'application/vnd.api+json',
        revision: KLAVIYO_API_REVISION,
      },
    });

    const latestProfile = response.body.data?.[0];
    if (latestProfile) {
      await context.store.put('lastCreated', latestProfile.attributes.created);
    }
  },
  async onDisable(context) {
    await context.store.delete('lastCreated');
  },
  async run(context) {
    const lastCreated = (await context.store.get<string>('lastCreated')) ?? '';

    const queryParams: Record<string, string> = {
      sort: '-created',
      'page[size]': '50',
    };
    if (lastCreated) {
      queryParams['filter'] = `greater-than(created,${lastCreated})`;
    }

    const response = await httpClient.sendRequest<{
      data: Array<{
        id: string;
        attributes: Record<string, unknown> & { created: string };
      }>;
    }>({
      method: HttpMethod.GET,
      url: `${KLAVIYO_API_URL}/profiles`,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      headers: {
        Accept: 'application/vnd.api+json',
        revision: KLAVIYO_API_REVISION,
      },
    });

    const newProfiles = response.body.data ?? [];

    if (newProfiles.length > 0) {
      await context.store.put('lastCreated', newProfiles[0].attributes.created);
    }

    return newProfiles.map((profile) => ({
      ...profile,
    }));
  },
  async test(context) {
    const response = await httpClient.sendRequest<{
      data: Array<Record<string, unknown>>;
    }>({
      method: HttpMethod.GET,
      url: `${KLAVIYO_API_URL}/profiles`,
      queryParams: {
        sort: '-created',
        'page[size]': '5',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      headers: {
        Accept: 'application/vnd.api+json',
        revision: KLAVIYO_API_REVISION,
      },
    });

    return response.body.data ?? [];
  },
});
