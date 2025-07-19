import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { smooveApiCall } from '../common/client';

export const unsubscribeContactAction = createAction({
  auth: smooveAuth,
  name: 'unsubscribe-contact',
  displayName: 'Unsubscribe Contact',
  description:
    'Unsubscribe a contact by ID, email, phone, or external ID. The contact will be moved to the "Unsubscribed" list and removed from all existing lists.',
  props: {
    identifierType: Property.StaticDropdown({
      displayName: 'Identifier Type',
      description: 'Choose the method to identify the contact',
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
      description: 'Value of the selected identifier type (e.g. email address, contact ID)',
      required: true,
    }),
    reason: Property.LongText({
      displayName: 'Reason for Unsubscribing',
      required: false,
    }),
  },
  async run(context) {
    const { identifierType, identifierValue, reason } = context.propsValue;

    const endpoint = `/Contacts/${encodeURIComponent(identifierValue)}/Unsubscribe?by=${identifierType}`;

    try {
      const response = await smooveApiCall({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: endpoint,
        body: reason ? { reason } : {},
      });

      return {
        success: true,
        message: 'Contact unsubscribed successfully.',
        response,
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
        throw new Error('Not Found: Contact not found or already unsubscribed.');
      }

      if (status === 500) {
        throw new Error('Internal Server Error: Please try again later.');
      }

      throw new Error(`Unsubscribe failed: ${error.message || 'Unknown error occurred'}`);
    }
  },
});
