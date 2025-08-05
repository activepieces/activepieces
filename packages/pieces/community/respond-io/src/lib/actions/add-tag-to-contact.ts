import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../../';
import { BASE_URL, commonProps } from '../common';

export const addTagToContact = createAction({
  auth: respondIoAuth,
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description: 'Assign a tag or multiple tags to a contact',
  props: {
    contactId: commonProps.contactId,
    tags: commonProps.tags,
  },
  async run(context) {
    const { contactId, tags } = context.propsValue;
    const { apiKey, workspaceId } = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/workspaces/${workspaceId}/contacts/${contactId}/tags`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        tags,
      },
    });

    return response.body;
  },
}); 