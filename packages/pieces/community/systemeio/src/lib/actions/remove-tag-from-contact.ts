import { createAction, Property } from '@activepieces/pieces-framework';
import { SystemeioApiClient } from '../api-client';
import { systemeioAuth } from '../auth';

export const removeTagFromContact = createAction({
  auth: systemeioAuth,
  name: 'remove_tag_from_contact',
  displayName: 'Remove Tag from Contact',
  description: 'Remove a tag from an existing contact.',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      required: true,
      description: 'The ID of the contact.'
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      required: true,
      description: 'The tag to remove.'
    })
  },
  async run({ auth, propsValue }) {
    const client = new SystemeioApiClient(auth);
    const response = await client.removeTagFromContact(propsValue.contactId, propsValue.tag);
    return response;
  },
}); 