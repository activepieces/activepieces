import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';
import { KlaviyoProfile } from '../common/types';

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'new_profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    type: 'profile',
    id: '01HXYZ123ABC456DEF',
    attributes: {
      email: 'john.doe@example.com',
      phone_number: '+12125551234',
      first_name: 'John',
      last_name: 'Doe',
      organization: 'Acme Corp',
      title: 'Software Engineer',
      created: '2025-01-15T12:00:00Z',
      updated: '2025-01-15T12:00:00Z',
      properties: {
        custom_field: 'value',
      },
    },
  },
  async onEnable(context) {
    // Initialize cursor by fetching the most recent profile
    try {
      const response = await klaviyoClient.getProfiles(
        context.auth,
        undefined,
        '-created'
      );
      
      if (response.data && response.data.length > 0) {
        const latestProfile = response.data[0];
        await context.store.put('last_profile_id', latestProfile.id);
      }
    } catch (error) {
      // If first run fails, we'll start fresh on first poll
      console.error('Failed to initialize trigger:', error);
    }
  },
  async onDisable(context) {
    await context.store.delete('last_profile_id');
  },
  async test(context) {
    // Return most recent profiles for testing
    const response = await klaviyoClient.getProfiles(
      context.auth,
      undefined,
      '-created'
    );
    
    return response.data.slice(0, 10);
  },
  async run(context) {
    const lastProfileId = await context.store.get<string>('last_profile_id');
    const newProfiles: KlaviyoProfile[] = [];
    
    let pageCursor: string | undefined = undefined;
    let foundLastProfile = false;

    // Fetch profiles in descending order by creation date
    while (!foundLastProfile) {
      const response = await klaviyoClient.getProfiles(
        context.auth,
        pageCursor,
        '-created'
      );

      if (!response.data || response.data.length === 0) {
        break;
      }

      for (const profile of response.data) {
        if (lastProfileId && profile.id === lastProfileId) {
          foundLastProfile = true;
          break;
        }
        newProfiles.push(profile);
      }

      // Check if there's a next page and we haven't found the last profile yet
      if (!foundLastProfile && response.links?.next) {
        // Extract cursor from next URL
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

      // Safety limit: don't fetch more than 100 profiles in one run
      if (newProfiles.length >= 100) {
        break;
      }
    }

    // Update the last seen profile ID
    if (newProfiles.length > 0) {
      await context.store.put('last_profile_id', newProfiles[0].id);
    }

    return newProfiles;
  },
});
