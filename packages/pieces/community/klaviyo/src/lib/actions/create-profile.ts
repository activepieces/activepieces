import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

export const createProfile = createAction({
  auth: klaviyoAuth,
  name: 'create_profile',
  displayName: 'Create Profile',
  description: 'Creates a new profile in Klaviyo.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number of the profile (E.164 format, e.g. +15005550006).',
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
      description: 'Additional custom key-value properties to attach to the profile.',
      required: false,
    }),
  },
  async run(context) {
    const { email, phone_number, first_name, last_name, organization, title, properties } =
      context.propsValue;

    const attributes: Record<string, unknown> = {};
    if (email) attributes['email'] = email;
    if (phone_number) attributes['phone_number'] = phone_number;
    if (first_name) attributes['first_name'] = first_name;
    if (last_name) attributes['last_name'] = last_name;
    if (organization) attributes['organization'] = organization;
    if (title) attributes['title'] = title;
    if (properties) attributes['properties'] = properties;

    const result = await klaviyoApiCall<unknown>({
      method: HttpMethod.POST,
      apiKey: context.auth,
      path: '/profiles',
      body: {
        data: {
          type: 'profile',
          attributes,
        },
      },
    });
    return result;
  },
});
