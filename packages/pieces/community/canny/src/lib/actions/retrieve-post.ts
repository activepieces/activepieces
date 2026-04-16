import { createAction, Property } from '@activepieces/pieces-framework';

import { cannyAuth } from '../auth';
import { cannyRequest } from '../common/client';

export const retrievePostAction = createAction({
  auth: cannyAuth,
  name: 'retrieve_post',
  displayName: 'Retrieve Post',
  description: 'Retrieves the details of an existing post by its ID.',
  props: {
    id: Property.ShortText({
      displayName: 'Post ID',
      description: 'The unique identifier of the post.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await cannyRequest({
      apiKey: auth.secret_text,
      path: '/posts/retrieve',
      body: { id: propsValue.id },
    });
  },
});
