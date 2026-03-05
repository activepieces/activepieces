import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';

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
  async run(context) {
    const { profileId, email, phoneNumber, firstName, lastName, title, organization } =
      context.propsValue;

    const attributes: Record<string, unknown> = {};
    if (email) attributes['email'] = email;
    if (phoneNumber) attributes['phone_number'] = phoneNumber;
    if (firstName) attributes['first_name'] = firstName;
    if (lastName) attributes['last_name'] = lastName;
    if (title) attributes['title'] = title;
    if (organization) attributes['organization'] = organization;

    return klaviyoApiRequest(
      context.auth as string,
      HttpMethod.PATCH,
      `/profiles/${profileId}`,
      {
        data: {
          type: 'profile',
          id: profileId,
          attributes,
        },
      },
    );
  },
});
