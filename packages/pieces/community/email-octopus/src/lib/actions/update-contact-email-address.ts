import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { octopusauth } from '../../index';
import { createHash } from 'crypto';

export const updateContactEmailAddress = createAction({
  auth: octopusauth,
  name: 'updateContactEmailAddress',
  displayName: 'Update Contact Email Address',
  description: 'Change the email address of a contact',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to search in',
      required: true,
    }),
    currentEmail: Property.ShortText({
      displayName: 'Current Email Address',
      description: 'The current email address of the contact to update',
      required: true,
    }),
    newEmail: Property.ShortText({
      displayName: 'New Email Address',
      description: 'The new email address for the contact',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the contact',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
        ],
      },
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
  },
  async run({ auth, propsValue }) {
    const { listId, currentEmail, newEmail, status, firstName, lastName } = propsValue;
    
    const contactId = createHash('md5').update(currentEmail.toLowerCase()).digest('hex');
    
    const body: any = {
      email_address: newEmail,
    };

    // Add optional fields if provided
    if (status) {
      body.status = status;
    }

    if (firstName || lastName) {
      body.fields = {};
      if (firstName) body.fields.FirstName = firstName;
      if (lastName) body.fields.LastName = lastName;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://api.emailoctopus.com/lists/${listId}/contacts/${contactId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body,
    });

    return response.body;
  },
});