import { createAction, Property, HttpMethod } from '@activepieces/pieces-framework';
import { systemeioAuth } from '../../';
import { SystemeioApiClient } from '../auth';

export const systemeioRemoveTagFromContact = createAction({
  auth: systemeioAuth,
  name: 'remove_tag_from_contact',
  displayName: 'Remove Tag from Contact',
  description: 'Remove a tag from an existing contact',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact',
      required: true,
    }),
    tagId: Property.ShortText({
      displayName: 'Tag ID',
      description: 'The ID of the tag to remove',
      required: true,
    }),
  },
  async run(context) {
    const { contactId, tagId } = context.propsValue;
    const client = new SystemeioApiClient(context.auth as string);
    return await client.request({
      method: HttpMethod.DELETE,
      path: `/contacts/${contactId}/tags/${tagId}`,
    });
  },
}); 