import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

export const subscribeProfile = createAction({
  name: 'subscribe_profile',
  auth: klaviyoAuth,
  displayName: 'Subscribe Profile',
  description: 'Subscribe a profile to email or SMS marketing.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile to subscribe',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number of the profile to subscribe (for SMS)',
      required: false,
    }),
    sms_consent: Property.Checkbox({
      displayName: 'SMS Consent',
      description: 'Enable to subscribe to SMS marketing',
      required: false,
      defaultValue: false,
    }),
    email_consent: Property.Checkbox({
      displayName: 'Email Consent',
      description: 'Enable to subscribe to email marketing',
      required: false,
      defaultValue: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
  },
  async run(context) {
    if (!context.propsValue.email && !context.propsValue.phone_number) {
      throw new Error('Either email or phone number must be provided');
    }

    const profileData: Record<string, any> = {};
    
    if (context.propsValue.email) {
      profileData.email = context.propsValue.email;
    }
    
    if (context.propsValue.phone_number) {
      profileData.phone_number = context.propsValue.phone_number;
    }
    
    if (context.propsValue.first_name) {
      profileData.first_name = context.propsValue.first_name;
    }
    
    if (context.propsValue.last_name) {
      profileData.last_name = context.propsValue.last_name;
    }

    // Build subscriptions array
    const subscriptions: Array<{ channel: string; consent: { consented_at: string; source: string }; marketing: { sms: boolean; email: boolean } }> = [];
    
    if (context.propsValue.sms_consent) {
      subscriptions.push({
        channel: 'sms',
        consent: {
          consented_at: new Date().toISOString(),
          source: 'API',
        },
        marketing: {
          sms: true,
          email: false,
        },
      });
    }
    
    if (context.propsValue.email_consent) {
      subscriptions.push({
        channel: 'email',
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

    const response = await httpClient.sendRequest({
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
          ...(subscriptions.length > 0 && { subscriptions }),
        },
      },
    });

    return response.body;
  },
});
