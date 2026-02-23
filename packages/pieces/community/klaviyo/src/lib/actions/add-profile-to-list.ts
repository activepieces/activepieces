import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

export const addProfileToList = createAction({
  name: 'add_profile_to_list',
  auth: klaviyoAuth,
  displayName: 'Add Profile to List',
  description: 'Add a profile to a specific list in Klaviyo.',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to add the profile to',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile to add',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
  },
  async run(context) {
    // First, create or get the profile
    const profileData: Record<string, any> = {
      email: context.propsValue.email,
    };
    
    if (context.propsValue.first_name) {
      profileData.first_name = context.propsValue.first_name;
    }
    
    if (context.propsValue.last_name) {
      profileData.last_name = context.propsValue.last_name;
    }
    
    if (context.propsValue.phone_number) {
      profileData.phone_number = context.propsValue.phone_number;
    }

    const profileResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://a.klaviyo.com/api/profiles',
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        data: {
          type: 'profile',
          attributes: profileData,
        },
      },
    });

    const profileId = profileResponse.body.data.id;

    // Add the profile to the list
    const listResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
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
      profile: profileResponse.body.data,
      list_id: context.propsValue.list_id,
      added_to_list: listResponse.body,
    };
  },
});
