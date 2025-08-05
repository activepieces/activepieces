import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../../';
import { BASE_URL, commonProps } from '../common';

export const deleteContact = createAction({
  auth: respondIoAuth,
  name: 'deleteContact',
  displayName: 'Delete Contact',
  description: 'Permanently delete a contact',
  props: {
    contactId: commonProps.contactId,
  },
  async run(context) {
    const { contactId } = context.propsValue;
    const { apiKey, workspaceId } = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${BASE_URL}/workspaces/${workspaceId}/contacts/${contactId}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return { success: true, message: 'Contact deleted successfully' };
  },
}); 