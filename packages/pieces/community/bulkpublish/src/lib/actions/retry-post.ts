import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bpRequest, bulkpublishAuth, postIdProp } from '../common';

export const retryPost = createAction({
  auth: bulkpublishAuth,
  name: 'retry_post',
  displayName: 'Retry Failed Post',
  description: 'Retry the platforms that failed for a post.',
  props: {
    postId: postIdProp,
    republish: Property.Checkbox({
      displayName: 'Also retry unconfirmed platforms',
      description: 'These may already have published, so retrying can create a duplicate.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return bpRequest(auth.secret_text, HttpMethod.POST, `/api/posts/${propsValue.postId}/retry`, {
      republish: propsValue.republish ?? false,
    });
  },
});
