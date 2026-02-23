import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

export const unsubscribeProfile = createAction({
  name: 'unsubscribe_profile',
  auth: klaviyoAuth,
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe a profile from email or SMS marketing.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile to unsubscribe',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number of the profile to unsubscribe (for SMS)',
      required: false,
    }),
    sms_unsubscribe: Property.Checkbox({
      displayName: 'SMS Unsubscribe',
      description: 'Enable to unsubscribe from SMS marketing',
      required: false,
      defaultValue: false,
    }),
    email_unsubscribe: Property.Checkbox({
      displayName: 'Email Unsubscribe',
      description: 'Enable to unsubscribe from email marketing',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    if (!context.propsValue.email && !context.propsValue.phone_number) {
      throw new Error('Either email or phone number must be provided');
    }

    // First, find the profile by email or phone
    let profileId: string | null = null;
    
    const filterValue = context.propsValue.email || context.propsValue.phone_number;
    const filterField = context.propsValue.email ? 'email' : 'phone_number';
    
    const searchResponse = await httpClient.sendRequest({
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
          attributes: {
            [filterField]: filterValue,
          },
        },
      },
    });

    const profiles = searchResponse.body.data;
    if (profiles && profiles.length > 0) {
      profileId = profiles[0].id;
    }

    if (!profileId) {
      return {
        success: false,
        message: 'Profile not found',
      };
    }

    // Build subscriptions array for unsubscribing
    const subscriptions: Array<{ channel: string; consent: { consented_at: string; source: string }; marketing: { sms: boolean; email: boolean } }> = [];
    
    if (context.propsValue.sms_unsubscribe) {
      subscriptions.push({
        channel: 'sms',
        consent: {
          consented_at: new Date().toISOString(),
          source: 'API',
        },
        marketing: {
          sms: false,
          email: true,
        },
      });
    }
    
    if (context.propsValue.email_unsubscribe) {
      subscriptions.push({
        channel: 'email',
        consent: {
          consented_at: new Date().toISOString(),
          source: 'API',
        },
        marketing: {
          sms: false,
          email: false,
        },
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `https://a.klaviyo.com/api/profiles/${profileId}`,
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        data: {
          type: 'profile',
          id: profileId,
          ...(subscriptions.length > 0 && { subscriptions }),
        },
      },
    });

    return {
      success: true,
      data: response.body.data,
    };
  },
});
