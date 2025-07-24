import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const addTagToContact = createAction({
  name: 'addTagToContact',
  displayName: 'Add Tag to Contact',
  description: 'Assign a tag to a contact in systeme.io.',
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
    tagId: Property.Dropdown({
      displayName: 'Tag',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.systeme.io/api/tags',
          headers: {
            'X-API-Key': String(auth),
          },
        });
        const items = response.body.items || [];
        return {
          options: items.map((tag: any) => ({
            label: tag.name,
            value: tag.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const contactId = context.propsValue['contactId'];
    const tagId = context.propsValue['tagId'];
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.systeme.io/api/contacts/${contactId}/tags`,
      headers: {
        'X-API-Key': String(context.auth),
        'Content-Type': 'application/json',
      },
      body: { tagId: Number(tagId) },
    });
    return response.body;
  },
}); 