import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const updateProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'update_profile',
  displayName: 'Update Profile',
  description: 'Update an existing profile in Klaviyo by profile ID.',
  props: {
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The Klaviyo profile ID to update',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title / Job Title',
      required: false,
    }),
    properties: Property.Object({
      displayName: 'Custom Properties',
      description: 'Additional custom properties as key-value pairs',
      required: false,
    }),
  },
  async run(context) {
    const {
      profile_id,
      email,
      phone_number,
      first_name,
      last_name,
      organization,
      title,
      properties,
    } = context.propsValue;

    const attributes: Record<string, unknown> = {};
    if (email) attributes['email'] = email;
    if (phone_number) attributes['phone_number'] = phone_number;
    if (first_name) attributes['first_name'] = first_name;
    if (last_name) attributes['last_name'] = last_name;
    if (organization) attributes['organization'] = organization;
    if (title) attributes['title'] = title;
    if (properties && Object.keys(properties).length > 0) {
      attributes['properties'] = properties;
    }

    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.PATCH,
      endpoint: `/profiles/${profile_id}`,
      body: {
        data: {
          type: 'profile',
          id: profile_id,
          attributes,
        },
      },
    });
  },
});
