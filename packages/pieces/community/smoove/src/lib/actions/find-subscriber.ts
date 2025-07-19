import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { smooveApiCall } from '../common/client';

export const findSubscriberAction = createAction({
  auth: smooveAuth,
  name: 'find-subscriber',
  displayName: 'Find Subscriber',
  description: 'Search for a subscriber by Contact ID, Email, Phone Number, or External ID and get their status.',
  props: {
    identifierType: Property.StaticDropdown({
      displayName: 'Identifier Type',
      description: 'Choose the method to identify the subscriber.',
      required: true,
      defaultValue: 'ContactId',
      options: {
        disabled: false,
        options: [
          { label: 'Contact ID', value: 'ContactId' },
          { label: 'Email', value: 'Email' },
          { label: 'Phone Number', value: 'Cellphone' },
          { label: 'External ID', value: 'ExternalId' },
        ],
      },
    }),
    identifierValue: Property.ShortText({
      displayName: 'Identifier Value',
      description: 'The actual value (e.g., the email or phone number) to search by.',
      required: true,
    }),
  },
  async run(context) {
    const { identifierType, identifierValue } = context.propsValue;

    const endpoint = `/Contacts/status/${encodeURIComponent(identifierValue)}?by=${identifierType}`;

    try {
      const response = await smooveApiCall<any>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: endpoint,
      });

      return {
        success: true,
        message: 'Subscriber found.',
        subscriber: response,
      };
    } catch (error: any) {
      const status = error.response?.status;

      if (status === 400) {
        throw new Error(`Bad Request: ${error.response?.data?.message || error.message}`);
      }

      if (status === 401) {
        throw new Error('Unauthorized: Invalid API key. Please check your credentials.');
      }

      if (status === 404) {
        throw new Error('Subscriber not found. Please verify the identifier value.');
      }

      if (status === 500) {
        throw new Error('Internal Server Error: Please try again later.');
      }

      throw new Error(`Failed to retrieve subscriber: ${error.message || 'Unknown error occurred'}`);
    }
  },
});
