import { createAction, Property, HttpMethod } from '@activepieces/pieces-framework';
import { systemeioAuth } from '../../';
import { SystemeioApiClient } from '../auth';

export const systemeioAddTagToContact = createAction({
  auth: systemeioAuth,
  name: 'add_tag_to_contact',
  displayName: 'Add Tag to Contact',
  description: 'Assign a tag to an existing contact',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact',
      required: true,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'The tag to add (e.g., "VIP")',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, tag } = context.propsValue;
    const client = new SystemeioApiClient(context.auth as string);
    return await client.request({
      method: HttpMethod.POST,
      path: `/contacts/${contactId}/tags`,
      contentType: 'application/json',
      body: { name: tag },
    });
  },
}); 