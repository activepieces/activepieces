import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const updateProfile = createAction({
  auth: klaviyoAuth,
  name: 'update_profile',
  displayName: 'Update Profile',
  description: 'Update an existing profile in Klaviyo.',
  props: {
    profileId: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The Klaviyo profile ID to update.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format.',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const attributes: Record<string, unknown> = {};
    if (propsValue.email) attributes['email'] = propsValue.email;
    if (propsValue.phoneNumber) attributes['phone_number'] = propsValue.phoneNumber;
    if (propsValue.firstName) attributes['first_name'] = propsValue.firstName;
    if (propsValue.lastName) attributes['last_name'] = propsValue.lastName;
    if (propsValue.title) attributes['title'] = propsValue.title;
    if (propsValue.organization) attributes['organization'] = propsValue.organization;
    return await klaviyoApiCall(
      auth as string,
      HttpMethod.PATCH,
      `/profiles/${propsValue.profileId}`,
      {
        data: {
          type: 'profile',
          id: propsValue.profileId,
          attributes,
        },
      },
    );
  },
});
