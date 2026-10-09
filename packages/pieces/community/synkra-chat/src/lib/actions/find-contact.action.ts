import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const findContactAction = createAction({
  auth: synkraChatAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Search for a contact by name, email, phone, or external ID.',
  props: {
    query: Property.ShortText({ displayName: 'Search', required: true }),
  },
  async run({ auth, propsValue }) {
    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.GET,
      path: '/contacts/search',
      queryParams: { q: propsValue.query },
    });
  },
});
