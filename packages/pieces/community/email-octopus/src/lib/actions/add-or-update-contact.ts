import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { octopusauth } from '../../index';

export const addOrUpdateContact = createAction({
  auth: octopusauth,
  name: 'addOrUpdateContact',
  displayName: 'Add or Update Contact',
  description: 'If the contact does not exist, it will be created. If the contact already exists, it will be updated.',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to add the contact to',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the contact',
      required: false,
      defaultValue: 'SUBSCRIBED',
      options: {
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { listId, email, firstName, lastName, status } = propsValue;
    
    const body: any = {
      email_address: email,
      status: status || 'SUBSCRIBED',
    };

    if (firstName || lastName) {
      body.fields = {};
      if (firstName) body.fields.FirstName = firstName;
      if (lastName) body.fields.LastName = lastName;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.emailoctopus.com/lists/${listId}/contacts`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth}`,
        },
        body,
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 409) {
        const updateResponse = await httpClient.sendRequest({
          method: HttpMethod.PUT,
          url: `https://api.emailoctopus.com/lists/${listId}/contacts/${encodeURIComponent(email)}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth}`,
          },
          body,
        });
        return updateResponse.body;
      }
      
      throw error;
    }
  },
});