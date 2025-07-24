import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const removeTagFromContact = createAction({
  name: 'removeTagFromContact',
  displayName: 'Remove Tag from Contact',
  description: 'Remove a tag from a contact in systeme.io.',
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
    tagId: Property.Number({ displayName: 'Tag ID', required: true }),
  },
  async run(context) {
    const contactId = context.propsValue['contactId'];
    const tagId = context.propsValue['tagId'];
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `https://api.systeme.io/api/contacts/${contactId}/tags/${Number(tagId)}`,
      headers: {
        'X-API-Key': String(context.auth),
      },
    });
    return response.body;
  },
}); 