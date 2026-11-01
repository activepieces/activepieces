import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../auth';
import { nuelinkClient } from '../common/client';
import { nuelinkPosts } from '../common/operations';
import { nuelinkProps } from '../common/props';
import { nuelinkOutputSchemas } from '../output-schemas';

export const deletePost = createAction({
  name: 'delete_post',
  classification: 'DESTRUCTIVE',
  auth: nuelinkAuths,
  displayName: 'Delete Post',
  description: 'Permanently deletes a post from Nuelink. Anything already published on a social network stays there. Needs "Allow AI to perform sensitive actions" turned on in Nuelink Settings → API.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes a post from Nuelink; anything already published on a social network stays there. Nuelink refuses this (403) unless the account owner enabled "Allow AI to perform sensitive actions" in Settings → API. Prefer Update Post with publishMode DRAFT to stop a post. Cannot be undone, and a repeat call fails with 404.',
    idempotent: false,
  },
  props: {
    brand: nuelinkProps.brand(),
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The numeric ID of the post to delete, from Create Post in Collection or List Posts.',
      required: true,
    }),
  },
  outputSchema: nuelinkOutputSchemas.deletePost,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brand, label: 'Brand' });
    const postId = nuelinkClient.numericId({ value: context.propsValue.postId, label: 'Post ID' });
    return nuelinkPosts.remove({ apiKey, brandId, postId });
  },
});
