import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';

export const subscribeProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'subscribe_profile',
  displayName: 'Subscribe Profile to List',
  description: 'Subscribe one or more profiles to a list in Klaviyo',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to subscribe profiles to',
      required: true,
    }),
    profiles: Property.Array({
      displayName: 'Profiles',
      description: 'Profiles to subscribe (provide email or phone)',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: false,
        }),
        phone: Property.ShortText({
          displayName: 'Phone Number',
          description: 'Phone number (E.164 format recommended)',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { listId, profiles } = context.propsValue;

    if (!profiles || profiles.length === 0) {
      throw new Error('At least one profile must be provided');
    }

    const profileData = profiles.map((profile: { email?: string; phone?: string }) => {
      const data: Record<string, string> = {};
      if (profile.email) data.email = profile.email;
      if (profile.phone) data.phone_number = profile.phone;
      
      if (!data.email && !data.phone_number) {
        throw new Error('Each profile must have either email or phone number');
      }
      
      return data;
    });

    return await klaviyoClient.subscribeProfiles(
      context.auth,
      listId,
      profileData
    );
  },
});
