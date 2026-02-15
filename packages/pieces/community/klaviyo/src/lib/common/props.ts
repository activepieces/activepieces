import { Property } from '@activepieces/pieces-framework';
import { klaviyoApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const KlaviyoProps = {
  listId: Property.Dropdown({
    displayName: 'List',
    description: 'Select a Klaviyo list.',
    required: true,
    refreshers: [],
    async options({ auth }) {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your account first', options: [] };
      }
      const response = await klaviyoApiCall<{
        data: { id: string; attributes: { name: string } }[];
      }>({
        apiKey: auth as string,
        method: HttpMethod.GET,
        path: '/lists',
      });
      return {
        disabled: false,
        options: response.data.map((list) => ({
          label: list.attributes.name,
          value: list.id,
        })),
      };
    },
  }),
  email: Property.ShortText({
    displayName: 'Email',
    description: 'The email address of the profile.',
    required: false,
  }),
  phoneNumber: Property.ShortText({
    displayName: 'Phone Number',
    description: 'The phone number of the profile (E.164 format, e.g. +15551234567).',
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
  profileId: Property.ShortText({
    displayName: 'Profile ID',
    description: 'The Klaviyo profile ID.',
    required: true,
  }),
};
