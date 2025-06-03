import { createAction, Property } from '@activepieces/pieces-framework';
import { crispAuth } from '../common/common';
import { crispClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findUserProfile = createAction({
  auth: crispAuth,
  name: 'find_user_profile',
  displayName: 'Find User Profile',
  description: 'Retrieves a user profile by email address',
  props: {
    websiteId: Property.ShortText({
      displayName: 'Website ID',
      required: true
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the user to find',
      required: true,
    }),
    includeConversations: Property.Checkbox({
      displayName: 'Include Conversations',
      description: 'Fetch the user\'s conversation history',
      required: false,
      defaultValue: false
    }),
    includeEvents: Property.Checkbox({
      displayName: 'Include Events',
      description: 'Fetch the user\'s activity events',
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    const { websiteId, email, includeConversations, includeEvents } = context.propsValue;
    
    // First get the basic profile
    const profile = await crispClient.makeRequest(
      context.auth,
      HttpMethod.GET,
      `/website/${websiteId}/people/profile/${email}`
    );

    // Optionally fetch additional data
    if (includeConversations) {
      profile.conversations = await crispClient.makeRequest(
        context.auth.token,
        HttpMethod.GET,
        `/website/${websiteId}/people/conversations/${email}`
      );
    }

    if (includeEvents) {
      profile.events = await crispClient.makeRequest(
        context.auth,
        HttpMethod.GET,
        `/website/${websiteId}/people/events/${email}`
      );
    }

    return profile;
  }
});