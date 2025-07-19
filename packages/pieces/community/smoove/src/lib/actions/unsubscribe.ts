import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { contactIdDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribe = createAction({
  auth: smooveAuth, name: 'unsubscribe',
  displayName: 'Unsubscribe',
  description: '',
  props: {
    contact_id: contactIdDropdown,

  },
  async run({ auth, propsValue }) {
    
    const { contact_id } = propsValue

    const response = await makeRequest(auth, HttpMethod.POST, `/Contacts/${contact_id}/Unsubscribe?by=ContactId`)
    return response
  },
});
