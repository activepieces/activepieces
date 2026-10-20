import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkClient } from '../../common/client';
import { nuelinkPosts } from '../../common/operations';
import { nuelinkOutputSchemas } from '../../output-schemas';

export const aiUpdatePost = createAction({
  name: 'nuelink_update_post',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Update Post',
  description: 'Changes the caption, publish mode, schedule or queue position of a post that is not published yet.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits an unpublished post from nuelink_create_post or nuelink_list_brand_posts: new caption (replaces the old one), publishMode DRAFT/QUEUE/SCHEDULE, or queuePosition FRONT/BACK. Setting DRAFT is the safe way to stop a post; prefer it over nuelink_delete_post. Moving a draft to QUEUE or SCHEDULE puts it on track to publish, so only do that on explicit user intent. scheduledAt must be ISO-8601 with an offset, at least 10 minutes ahead. Published posts (409) and polls (400) cannot be edited. Re-sending the same values changes nothing.',
    idempotent: true,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    postId: nuelinkAiProps.idText({ displayName: 'Post ID', description: 'The numeric post ID from nuelink_create_post or nuelink_list_brand_posts.', required: true }),
    caption: Property.LongText({ displayName: 'New Caption', description: 'Replaces the post text (up to 3,000 characters). Leave empty to keep it.', required: false }),
    publishMode: Property.StaticDropdown({
      displayName: 'New Publish Mode',
      description: 'Leave empty to keep the current mode.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Queue', value: 'QUEUE' },
          { label: 'Schedule', value: 'SCHEDULE' },
        ],
      },
    }),
    scheduledAt: Property.ShortText({
      displayName: 'Scheduled Time',
      description: 'Required with New Publish Mode SCHEDULE, not allowed otherwise. ISO-8601 with an offset, e.g. 2026-10-12T09:00:00+03:00.',
      required: false,
    }),
    queuePosition: Property.StaticDropdown({
      displayName: 'Queue Position',
      description: 'Move a queued post to the front or back of its queue.',
      required: false,
      options: {
        options: [
          { label: 'Front', value: 'FRONT' },
          { label: 'Back', value: 'BACK' },
        ],
      },
    }),
  },
  outputSchema: nuelinkOutputSchemas.updatePost,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const postId = nuelinkClient.numericId({ value: context.propsValue.postId, label: 'Post ID' });
    return nuelinkPosts.update({ apiKey, brandId, postId, props: context.propsValue });
  },
});
