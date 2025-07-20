import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { smooveApiCall } from '../common/client';
import { listIdDropdown } from '../common/props';

export const addOrUpdateSubscriberAction = createAction({
  auth: smooveAuth,
  name: 'add-or-update-subscriber',
  displayName: 'Add or Update Subscriber',
  description: 'Create or update a subscriber and manage their list subscriptions.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the subscriber.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    cellphone: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    listId: listIdDropdown,
    unsubscribe: Property.Checkbox({
      displayName: 'Unsubscribe',
      description: 'Set to true to unsubscribe the contact from all lists.',
      required: false,
      defaultValue: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Optional custom fields to add to the subscriber (key-value format).',
      required: false,
    }),
  },
  async run(context) {
    const { email, firstName, lastName, cellphone, listId, unsubscribe, customFields } = context.propsValue;

    const payload: Record<string, any> = {
      Email: email,
      FirstName: firstName,
      LastName: lastName,
      CellPhone: cellphone,
      ListIds: [listId],
      Unsubscribe: unsubscribe,
    };

    if (customFields) {
      payload['CustomFields'] = customFields;
    }

    try {
      const response = await smooveApiCall<any>({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: '/v1/Contacts',
        body: payload,
      });

      return {
        success: true,
        message: 'Subscriber added or updated successfully.',
        data: response,
      };
    } catch (error: any) {
      const status = error.response?.status;

      if (status === 400) {
        throw new Error(`Bad Request: ${error.response?.data?.message || error.message}`);
      }

      if (status === 401) {
        throw new Error('Unauthorized: Invalid API key. Please check your credentials.');
      }

      if (status === 500) {
        throw new Error('Internal Server Error: Please try again later.');
      }

      throw new Error(`Failed to add or update subscriber: ${error.message || 'Unknown error occurred'}`);
    }
  },
});
