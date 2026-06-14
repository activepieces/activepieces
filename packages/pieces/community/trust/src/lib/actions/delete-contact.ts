import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const deleteContactAction = createAction({
  auth: trustAuth,
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Deletes a contact by ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete a Trust contact identified by its contact ID. Pick this only when the contact record should be removed entirely; this is destructive and cannot be undone via the API. Deleting by a fixed ID is idempotent in effect — repeating the call leaves the same end state, though a second attempt may return an error since the contact no longer exists.',
    idempotent: true,
  },
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to delete.',
      required: true,
    }),
  },
  async run(context) {
    const { props } = context.auth;
    const response = await trustApiRequest({
      apiKey: props.api_key,
      method: HttpMethod.DELETE,
      path: `/contacts/${context.propsValue.contactId}`,
    });
    return response.body;
  },
});
