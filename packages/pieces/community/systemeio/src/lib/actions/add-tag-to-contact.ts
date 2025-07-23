import { createAction, Property } from '@activepieces/pieces-framework';
import { SystemeioApiClient } from '../api-client';
import { systemeioAuth } from '../auth';

export const addTagToContact = createAction({
  auth: systemeioAuth,
  name: 'add_tag_to_contact',
  displayName: 'Add Tag to Contact',
  description: 'Assign a tag to an existing contact.',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      required: true,
      description: 'The ID of the contact.'
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      required: true,
      description: 'The tag to assign.'
    })
  },
  async run({ auth, propsValue }) {
    const client = new SystemeioApiClient(auth);
    const response = await client.addTagToContact(propsValue.contactId, propsValue.tag);
    return response;
  },
});