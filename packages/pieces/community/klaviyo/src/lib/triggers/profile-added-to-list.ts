import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { KlaviyoProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoProfileAddedToListTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'klaviyo_profile_added_to_list',
  displayName: 'Profile Added to List/Segment',
  description: 'Fires when a profile is added to a specific list or segment.',
  props: {
    list_id: KlaviyoProps.listId,
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    // Store current profile IDs in the list as baseline
    const response = await klaviyoApiCall<{
      data: { id: string }[];
    }>({
      apiKey: context.auth,
      method: HttpMethod.GET,
      path: `/lists/${context.propsValue.list_id}/profiles`,
      queryParams: { 'page[size]': '100' },
    });

    const knownIds = response.data.map((p) => p.id);
    await context.store.put('knownProfileIds', JSON.stringify(knownIds));
  },
  onDisable: async (context) => {
    await context.store.delete('knownProfileIds');
  },
  run: async (context) => {
    const knownIdsStr = (await context.store.get('knownProfileIds')) as string;
    const knownIds = new Set<string>(knownIdsStr ? JSON.parse(knownIdsStr) : []);

    const response = await klaviyoApiCall<{
      data: { id: string }[];
    }>({
      apiKey: context.auth,
      method: HttpMethod.GET,
      path: `/lists/${context.propsValue.list_id}/profiles`,
      queryParams: { 'page[size]': '100' },
    });

    const currentIds = response.data.map((p) => p.id);
    const newProfileIds = currentIds.filter((id) => !knownIds.has(id));

    // Fetch full profile data for new additions
    const newProfiles = [];
    for (const profileId of newProfileIds) {
      const profile = await klaviyoApiCall({
        apiKey: context.auth,
        method: HttpMethod.GET,
        path: `/profiles/${profileId}`,
      });
      newProfiles.push(profile);
    }

    // Update known IDs
    await context.store.put('knownProfileIds', JSON.stringify(currentIds));

    return newProfiles;
  },
  test: async (context) => {
    const response = await klaviyoApiCall<{
      data: { id: string }[];
    }>({
      apiKey: context.auth,
      method: HttpMethod.GET,
      path: `/lists/${context.propsValue.list_id}/profiles`,
      queryParams: { 'page[size]': '5' },
    });

    const profiles = [];
    for (const item of response.data) {
      const profile = await klaviyoApiCall({
        apiKey: context.auth,
        method: HttpMethod.GET,
        path: `/profiles/${item.id}`,
      });
      profiles.push(profile);
    }

    return profiles;
  },
});
