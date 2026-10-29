import { createAction } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkClient } from '../../common/client';
import { nuelinkPosts } from '../../common/operations';
import { nuelinkOutputSchemas } from '../../output-schemas';

export const aiDeletePost = createAction({
  name: 'nuelink_delete_post',
  classification: 'DESTRUCTIVE',
  auth: nuelinkAuths,
  displayName: 'Delete Post',
  description: 'Permanently deletes a post from Nuelink, in any status. Content already on a social network stays there.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one post from Nuelink (any status, published included); what is already on a social network stays there. To only stop a post from going out, use nuelink_update_post with publishMode DRAFT instead. Nuelink refuses this (403) unless the account owner enabled "Allow AI to perform sensitive actions" in Settings → API. Cannot be undone; a repeat call returns 404.',
    idempotent: false,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    postId: nuelinkAiProps.idText({ displayName: 'Post ID', description: 'The numeric post ID from nuelink_list_brand_posts.', required: true }),
  },
  outputSchema: nuelinkOutputSchemas.deletePost,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const postId = nuelinkClient.numericId({ value: context.propsValue.postId, label: 'Post ID' });
    return nuelinkPosts.remove({ apiKey, brandId, postId });
  },
});
