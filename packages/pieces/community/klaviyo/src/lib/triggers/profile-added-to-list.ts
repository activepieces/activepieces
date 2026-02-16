import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';
import { KlaviyoProfile } from '../common/types';

export const profileAddedToListTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list',
  displayName: 'Profile Added to List',
  description: 'Triggers when a profile is added to a specific list in Klaviyo',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to monitor',
      required: true,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    type: 'profile',
    id: '01HXYZ123ABC456DEF',
    attributes: {
      email: 'jane.smith@example.com',
      phone_number: '+12125555678',
      first_name: 'Jane',
      last_name: 'Smith',
      created: '2025-01-15T12:00:00Z',
      updated: '2025-01-15T12:00:00Z',
    },
  },
  async onEnable(context) {
    const { listId } = context.propsValue;
    
    // Initialize by fetching current profiles in the list
    try {
      const response = await klaviyoClient.getListProfiles(
        context.auth,
        listId
      );
      
      // Store all current profile IDs
      if (response.data && response.data.length > 0) {
        const profileIds = response.data.map(p => p.id);
        await context.store.put(`list_${listId}_profile_ids`, profileIds);
      } else {
        await context.store.put(`list_${listId}_profile_ids`, []);
      }
    } catch (error) {
      console.error('Failed to initialize trigger:', error);
      await context.store.put(`list_${listId}_profile_ids`, []);
    }
  },
  async onDisable(context) {
    const { listId } = context.propsValue;
    await context.store.delete(`list_${listId}_profile_ids`);
  },
  async test(context) {
    const { listId } = context.propsValue;
    
    // Return recent profiles from the list for testing
    const response = await klaviyoClient.getListProfiles(
      context.auth,
      listId
    );
    
    return response.data.slice(0, 10);
  },
  async run(context) {
    const { listId } = context.propsValue;
    const lastProfileIds = await context.store.get<string[]>(`list_${listId}_profile_ids`) || [];
    
    const currentProfiles: KlaviyoProfile[] = [];
    let pageCursor: string | undefined = undefined;

    // Fetch all current profiles in the list
    while (true) {
      const response = await klaviyoClient.getListProfiles(
        context.auth,
        listId,
        pageCursor
      );

      if (!response.data || response.data.length === 0) {
        break;
      }

      currentProfiles.push(...response.data);

      // Check if there's a next page
      if (response.links?.next) {
        const nextUrl = response.links.next;
        const cursorMatch = nextUrl.match(/page\[cursor\]=([^&]+)/);
        if (cursorMatch) {
          pageCursor = decodeURIComponent(cursorMatch[1]);
        } else {
          break;
        }
      } else {
        break;
      }

      // Safety limit
      if (currentProfiles.length >= 1000) {
        break;
      }
    }

    // Find new profiles (profiles that are in current list but not in last known list)
    const currentProfileIds = currentProfiles.map(p => p.id);
    const newProfileIds = currentProfileIds.filter(id => !lastProfileIds.includes(id));
    const newProfiles = currentProfiles.filter(p => newProfileIds.includes(p.id));

    // Update stored profile IDs
    await context.store.put(`list_${listId}_profile_ids`, currentProfileIds);

    return newProfiles;
  },
});
