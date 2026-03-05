import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import {
  KLAVIYO_API_URL,
  KLAVIYO_API_REVISION,
  listListsForDropdown,
} from '../common';

export const profileAddedToListTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list',
  displayName: 'Profile Added to List',
  description:
    'Triggers when a profile is added to a specific list or segment.',
  type: TriggerStrategy.POLLING,
  props: {
    listId: Property.Dropdown({
      displayName: 'List',
      description: 'The list to monitor for new profiles.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Klaviyo account first.',
            options: [],
          };
        }
        const options = await listListsForDropdown(auth as string);
        return { disabled: false, options };
      },
    }),
  },
  sampleData: {
    type: 'profile',
    id: 'EXAMPLE_ID',
    attributes: {
      email: 'example@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
    },
  },
  async onEnable(context) {
    const response = await httpClient.sendRequest<{
      data: Array<{ id: string }>;
    }>({
      method: HttpMethod.GET,
      url: `${KLAVIYO_API_URL}/lists/${context.propsValue.listId}/profiles`,
      queryParams: { 'page[size]': '50' },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      headers: {
        Accept: 'application/vnd.api+json',
        revision: KLAVIYO_API_REVISION,
      },
    });

    const knownIds = (response.body.data ?? []).map((p) => p.id);
    await context.store.put('knownProfileIds', JSON.stringify(knownIds));
  },
  async onDisable(context) {
    await context.store.delete('knownProfileIds');
  },
  async run(context) {
    const knownIdsRaw = await context.store.get<string>('knownProfileIds');
    const knownIds: string[] = knownIdsRaw ? JSON.parse(knownIdsRaw) : [];
    const knownSet = new Set(knownIds);

    const response = await httpClient.sendRequest<{
      data: Array<{ id: string; attributes: Record<string, unknown> }>;
    }>({
      method: HttpMethod.GET,
      url: `${KLAVIYO_API_URL}/lists/${context.propsValue.listId}/profiles`,
      queryParams: { 'page[size]': '50' },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      headers: {
        Accept: 'application/vnd.api+json',
        revision: KLAVIYO_API_REVISION,
      },
    });

    const currentProfiles = response.body.data ?? [];
    const newProfiles = currentProfiles.filter((p) => !knownSet.has(p.id));

    const currentIds = currentProfiles.map((p) => p.id);
    await context.store.put('knownProfileIds', JSON.stringify(currentIds));

    return newProfiles;
  },
  async test(context) {
    const response = await httpClient.sendRequest<{
      data: Array<Record<string, unknown>>;
    }>({
      method: HttpMethod.GET,
      url: `${KLAVIYO_API_URL}/lists/${context.propsValue.listId}/profiles`,
      queryParams: { 'page[size]': '5' },
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
