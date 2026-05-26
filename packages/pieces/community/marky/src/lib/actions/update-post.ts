import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient, PostUpdateRequest } from '../common/client';
import { markyProps } from '../common/props';
import { markyUtils } from '../common/utils';

const updatePostAction = createAction({
  auth: markyAuth,
  name: 'update-post',
  displayName: 'Update Post',
  description: "Update a Marky post's caption or target platforms.",
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The ID of the post to update.',
      required: true,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Updated caption text. Leave empty to keep the current caption.',
      required: false,
    }),
    publishTo: markyProps.platforms(),
  },
  async run(context) {
    const postId = markyUtils.getRequiredString({
      value: context.propsValue.postId,
      fieldName: 'Post ID',
    });
    const caption = markyUtils.getOptionalString({
      value: context.propsValue.caption,
    });
    const publishTo = markyUtils.getOptionalStringArray({
      value: context.propsValue.publishTo,
      fieldName: 'Platforms',
    });

    if (caption === undefined && publishTo === undefined) {
      throw new Error('Provide at least Caption or Platforms to update.');
    }

    const body: PostUpdateRequest = {};
    if (caption !== undefined) body.caption = caption;
    if (publishTo !== undefined) body.publish_to = publishTo;

    const result = await markyClient.updatePost({
      apiKey: context.auth.secret_text,
      postId,
      body,
    });

    if (!result.ok) {
      throw new Error(`Failed to update post: ${result.message}`);
    }

    return result.data;
  },
});

export { updatePostAction };
