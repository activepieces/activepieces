import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { trustAuth } from '../auth';
import { trustApiRequest } from '../common/client';

export const deleteContactAction = createAction({
  auth: trustAuth,
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Deletes a contact by ID.',
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
