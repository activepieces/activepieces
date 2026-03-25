import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { omnisendAuth } from '../auth';
import { omnisendRequest } from '../common/client';

export const createOrUpdateContactAction = createAction({
  auth: omnisendAuth,
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description:
    'Create a new contact or update an existing contact in Omnisend. If a contact with the same email already exists, it will be updated.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email address (used as identifier).',
      required: true,
    }),
    emailStatus: Property.StaticDropdown({
      displayName: 'Email Subscription Status',
      description: 'The subscription status for the email channel.',
      required: true,
      options: {
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Non-subscribed', value: 'nonSubscribed' },
        ],
      },
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Contact first name.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Contact last name.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Contact country name.',
      required: false,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter country code (ISO 3166-1 alpha-2).',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'Contact city.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to assign to the contact.',
      required: false,
    }),
    sendWelcomeMessage: Property.Checkbox({
      displayName: 'Send Welcome Message',
      description: 'Send a welcome email to the contact upon creation.',
      required: false,
      defaultValue: false,
    }),
    customProperties: Property.Object({
      displayName: 'Custom Properties',
      description:
        'Custom key-value properties to store on the contact (e.g. {"shoeSize": 42, "plan": "premium"}).',
      required: false,
    }),
  },
  async run(context) {
    const {
      email,
      emailStatus,
      firstName,
      lastName,
      country,
      countryCode,
      city,
      tags,
      sendWelcomeMessage,
      customProperties,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      identifiers: [
        {
          type: 'email',
          id: email,
          channels: {
            email: {
              status: emailStatus,
            },
          },
        },
      ],
      sendWelcomeMessage: sendWelcomeMessage ?? false,
    };

    if (firstName) body['firstName'] = firstName;
    if (lastName) body['lastName'] = lastName;
    if (country) body['country'] = country;
    if (countryCode) body['countryCode'] = countryCode;
    if (city) body['city'] = city;
    if (tags && (tags as string[]).length > 0) body['tags'] = tags;
    if (
      customProperties &&
      Object.keys(customProperties as Record<string, unknown>).length > 0
    ) {
      body['customProperties'] = customProperties;
    }

    return omnisendRequest(
      HttpMethod.POST,
      '/contacts',
      context.auth.secret_text,
      body,
    );
  },
});
