import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { omnisendAuth } from '../auth';
import { omnisendRequest } from '../common/client';

export const getContactAction = createAction({
  auth: omnisendAuth,
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Retrieve a contact by their Omnisend contact ID.',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The Omnisend contact ID.',
      required: true,
    }),
  },
  async run(context) {
    const { contactId } = context.propsValue;
    return omnisendRequest(
      HttpMethod.GET,
      `/contacts/${contactId}`,
      context.auth.secret_text,
    );
  },
});
