import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { octopusauth } from '../../index';
import { createHash } from 'crypto';

export const findContact = createAction({
  auth: octopusauth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Look up a contact by email address within a given list.',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to search in',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact to find',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { listId, email } = propsValue;
    
    const contactId = createHash('md5').update(email.toLowerCase()).digest('hex');
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.emailoctopus.com/lists/${listId}/contacts/${contactId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
    });

    return response.body;
  },
});