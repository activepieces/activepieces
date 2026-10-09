import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const getContactAction = createAction({
  auth: synkraChatAuth,
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Fetch a single contact by their ID.',
  props: {
    contact_id: Property.Number({ displayName: 'Contact ID', required: true }),
  },
  async run({ auth, propsValue }) {
    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.GET,
      path: `/contacts/${propsValue.contact_id}`,
    });
  },
});
