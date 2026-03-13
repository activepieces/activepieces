import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

export const updateProfile = createAction({
  auth: klaviyoAuth,
  name: 'update_profile',
  displayName: 'Update Profile',
  description: 'Updates an existing Klaviyo profile by ID.',
  props: {
    profile_id: Property.ShortText({
      displayName: 'Profile ID',
      description: 'The ID of the Klaviyo profile to update.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
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
      displayName: 'Title',
      required: false,
    }),
    properties: Property.Json({
      displayName: 'Custom Properties',
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
    if (properties) attributes['properties'] = properties;

    const result = await klaviyoApiCall<unknown>({
      method: HttpMethod.PATCH,
      apiKey: context.auth,
      path: `/profiles/${profile_id}`,
      body: {
        data: {
          type: 'profile',
          id: profile_id,
          attributes,
        },
      },
    });
    return result;
  },
});
