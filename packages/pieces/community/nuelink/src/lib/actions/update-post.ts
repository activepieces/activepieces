import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../auth';
import { nuelinkClient } from '../common/client';
import { nuelinkPosts } from '../common/operations';
import { nuelinkProps } from '../common/props';
import { nuelinkOutputSchemas } from '../output-schemas';

export const updatePost = createAction({
  name: 'update_post',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Update Post',
  description: 'Changes the caption of a post that is not published yet, turns it back into a draft, reschedules it or moves it in the queue.',
  audience: 'human',
  aiMetadata: {
    description:
      'Edits a post that has not been published yet: change its caption, turn it back into a draft, reschedule it, re-queue it, or move it to the front or back of its queue. Published posts (409) and polls cannot be edited. To stop a post from going out, set publishMode DRAFT rather than deleting it. Setting the same values again changes nothing.',
    idempotent: true,
  },
  props: {
    brand: nuelinkProps.brand(),
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The numeric ID of the post, from Create Post in Collection or List Posts.',
      required: true,
    }),
    caption: Property.LongText({
      displayName: 'New Caption',
      description: 'Replaces the post text (up to 3,000 characters). Leave empty to keep the current caption. Media is not changed.',
      required: false,
    }),
    publishMode: Property.StaticDropdown({
      displayName: 'New Publish Mode',
      description: 'Leave empty to keep the current mode.',
      required: false,
      options: {
        options: [
          { label: 'Draft (stop it from publishing)', value: 'DRAFT' },
          { label: 'Add to Queue', value: 'QUEUE' },
          { label: 'Schedule', value: 'SCHEDULE' },
        ],
      },
    }),
    scheduledAt: Property.DateTime({
      displayName: 'Scheduled Time',
      description: 'Required when New Publish Mode is Schedule, at least 10 minutes ahead; not allowed otherwise. Include a timezone offset.',
      required: false,
    }),
    queuePosition: Property.StaticDropdown({
      displayName: 'Queue Position',
      description: 'Move a queued post to the front or back of its collection queue. Works on its own or with New Publish Mode = Add to Queue.',
      required: false,
      options: {
        options: [
          { label: 'Front (publish next)', value: 'FRONT' },
          { label: 'Back', value: 'BACK' },
        ],
      },
    }),
  },
  outputSchema: nuelinkOutputSchemas.updatePost,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brand, label: 'Brand' });
    const postId = nuelinkClient.numericId({ value: context.propsValue.postId, label: 'Post ID' });
    return nuelinkPosts.update({ apiKey, brandId, postId, props: context.propsValue });
  },
});
