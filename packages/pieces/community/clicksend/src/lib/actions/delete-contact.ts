import { createAction, Property } from '@activepieces/pieces-framework';
import { clicksendAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { listIdDropdown, contactIdDropdown } from '../common/props';

export const deleteContact = createAction({
  auth: clicksendAuth,
  name: 'deleteContact',
  displayName: 'Delete Contact',
  description: 'Delete a specific contact from a ClickSend contact list',
  props: {
    list_id: listIdDropdown,
    contact_id: contactIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { username, password } = auth;
    const apiKey = `${username}:${password}`;

    const response = await makeRequest(
      apiKey,
      HttpMethod.DELETE,
      `/lists/${propsValue.list_id}/contacts/${propsValue.contact_id}`
    );

    return response;
  },
});
