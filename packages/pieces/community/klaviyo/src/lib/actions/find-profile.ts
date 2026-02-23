import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

export const findProfile = createAction({
  name: 'find_profile',
  auth: klaviyoAuth,
  displayName: 'Find Profile',
  description: 'Search for a profile by email or phone number in Klaviyo.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile to search for',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number of the profile to search for',
      required: false,
    }),
  },
  async run(context) {
    if (!context.propsValue.email && !context.propsValue.phone_number) {
      throw new Error('Either email or phone number must be provided');
    }

    const filterValue = context.propsValue.email || context.propsValue.phone_number;
    const filterField = context.propsValue.email ? 'email' : 'phone_number';

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://a.klaviyo.com/api/profiles',
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${context.auth.secret_text}`,
      },
      queryParams: {
        filter: `equals(${filterField},"${filterValue}")`,
      },
    });

    const profiles = response.body.data || [];
    
    if (profiles.length === 0) {
      return {
        success: true,
        found: false,
        message: `No profile found with ${filterField}: "${filterValue}"`,
      };
    }

    return {
      success: true,
      found: true,
      count: profiles.length,
      profiles: profiles.map((profile: any) => ({
        id: profile.id,
        email: profile.attributes.email,
        phone_number: profile.attributes.phone_number,
        first_name: profile.attributes.first_name,
        last_name: profile.attributes.last_name,
        created: profile.attributes.created,
        updated: profile.attributes.updated,
        subscriptions: profile.attributes.subscriptions,
      })),
      primary_match: {
        id: profiles[0].id,
        email: profiles[0].attributes.email,
        phone_number: profiles[0].attributes.phone_number,
        first_name: profiles[0].attributes.first_name,
        last_name: profiles[0].attributes.last_name,
        created: profiles[0].attributes.created,
        updated: profiles[0].attributes.updated,
        subscriptions: profiles[0].attributes.subscriptions,
      },
    };
  },
});
