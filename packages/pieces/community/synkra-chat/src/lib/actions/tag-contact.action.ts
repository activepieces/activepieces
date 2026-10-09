import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { synkraChatAuth } from '../auth';
import { synkraChatRequest } from '../common/client';

export const tagContactAction = createAction({
  auth: synkraChatAuth,
  name: 'tag_contact',
  displayName: 'Tag Contact',
  description: 'Add labels to a contact.',
  props: {
    contact_id: Property.Number({ displayName: 'Contact ID', required: true }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'One or more label names.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return synkraChatRequest({
      auth: auth.props,
      method: HttpMethod.POST,
      path: `/contacts/${propsValue.contact_id}/labels`,
      body: { labels: propsValue.labels },
    });
  },
});
