import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient } from '../common/client';
import { markyUtils } from '../common/utils';

const getPostAction = createAction({
  auth: markyAuth,
  name: 'get-post',
  displayName: 'Get Post',
  description: 'Retrieve a single Marky post by ID.',
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The ID of the post to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const postId = markyUtils.getRequiredString({
      value: context.propsValue.postId,
      fieldName: 'Post ID',
    });

    const result = await markyClient.getPost({
      apiKey: context.auth.secret_text,
      postId,
    });

    if (!result.ok) {
      throw new Error(`Failed to get post: ${result.message}`);
    }

    return result.data;
  },
});

export { getPostAction };
