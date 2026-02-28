import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const profileAddedToList = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list',
  displayName: 'Profile Added to List',
  description: 'Fires when a profile is added to a specific list.',
  type: TriggerStrategy.POLLING,
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to monitor.',
      required: true,
    }),
  },
  sampleData: {
    type: 'profile',
    id: 'EXAMPLE_ID',
    attributes: {
      email: 'test@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      joined_group_at: '2024-01-01T00:00:00+00:00',
    },
  },
  onEnable: async (context) => {
    const response = await klaviyoApiCall<{
      data: Array<{ id: string }>;
    }>(
      context.auth as string,
      HttpMethod.GET,
      `/lists/${context.propsValue.listId}/profiles`,
      undefined,
      { 'page[size]': '1' },
    );
    const knownIds = (response.data ?? []).map((p) => p.id);
    await context.store.put('knownProfileIds', JSON.stringify(knownIds));
  },
  onDisable: async (context) => {
    await context.store.delete('knownProfileIds');
  },
  run: async (context) => {
    const knownIdsStr = await context.store.get<string>('knownProfileIds');
    const knownIds: string[] = knownIdsStr ? JSON.parse(knownIdsStr) : [];

    const response = await klaviyoApiCall<{
      data: Array<{ id: string; attributes: Record<string, unknown> }>;
    }>(
      context.auth as string,
      HttpMethod.GET,
      `/lists/${context.propsValue.listId}/profiles`,
      undefined,
      { 'page[size]': '100' },
    );

    const currentProfiles = response.data ?? [];
    const currentIds = currentProfiles.map((p) => p.id);
    const newProfiles = currentProfiles.filter((p) => !knownIds.includes(p.id));

    await context.store.put('knownProfileIds', JSON.stringify(currentIds));

    return newProfiles.map((profile) => ({
      ...profile,
      ...profile.attributes,
    }));
  },
  test: async (context) => {
    const response = await klaviyoApiCall<{
      data: Array<{ id: string; attributes: Record<string, unknown> }>;
    }>(
      context.auth as string,
      HttpMethod.GET,
      `/lists/${context.propsValue.listId}/profiles`,
      undefined,
      { 'page[size]': '5' },
    );

    return (response.data ?? []).map((profile) => ({
      ...profile,
      ...profile.attributes,
    }));
  },
});
