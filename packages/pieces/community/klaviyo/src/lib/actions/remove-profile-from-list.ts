import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

export const removeProfileFromList = createAction({
  name: 'remove_profile_from_list',
  auth: klaviyoAuth,
  displayName: 'Remove Profile from List',
  description: 'Remove a profile from a specific list in Klaviyo.',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to remove the profile from',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile to remove',
      required: true,
    }),
  },
  async run(context) {
    // First, find the profile by email
    const searchResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://a.klaviyo.com/api/profiles',
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${context.auth.secret_text}`,
      },
      queryParams: {
        filter: `equals(email,"${context.propsValue.email}")`,
      },
    });

    const profiles = searchResponse.body.data;
    
    if (!profiles || profiles.length === 0) {
      return {
        success: false,
        message: 'Profile not found',
      };
    }

    const profileId = profiles[0].id;

    // Remove the profile from the list
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://a.klaviyo.com/api/lists/${context.propsValue.list_id}/profiles`,
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        data: [{
          type: 'profile',
          id: profileId,
        }],
      },
    });

    return {
      success: true,
      profile_id: profileId,
      email: context.propsValue.email,
      list_id: context.propsValue.list_id,
      removed: true,
    };
  },
});
