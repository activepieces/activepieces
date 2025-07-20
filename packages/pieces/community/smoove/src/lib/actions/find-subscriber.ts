import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { smooveApiCall } from '../common/client';
import { contactIdDropdown } from '../common/props';

export const findSubscriberAction = createAction({
  auth: smooveAuth,
  name: 'find-subscriber',
  displayName: 'Find Subscriber',
  description: 'Search for a subscriber by Contact ID, Email, Phone Number, or External ID and get their status.',
  props: {
    identifierType: Property.StaticDropdown({
      displayName: 'Identifier Type',
      description: 'Choose how to identify the subscriber.',
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
    contactId: contactIdDropdown,
    identifierValue: Property.ShortText({
      displayName: 'Identifier Value',
      description: 'Enter the email, phone number, or external ID.',
      required: false,
    }),
  },
  async run(context) {
    const { identifierType, contactId, identifierValue } = context.propsValue;

    let valueToUse: string;
    if (identifierType === 'ContactId') {
      if (!contactId) {
        throw new Error('Please select a Contact ID.');
      }
      valueToUse = contactId;
    } else {
      if (!identifierValue) {
        throw new Error('Please provide a value for the selected identifier type.');
      }
      valueToUse = identifierValue;
    }

    const endpoint = `/Contacts/status/${encodeURIComponent(valueToUse)}?by=${identifierType}`;

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
