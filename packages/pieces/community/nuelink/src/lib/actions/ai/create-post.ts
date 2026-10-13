import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../../auth';
import { nuelinkAiProps } from '../../common/ai-props';
import { nuelinkClient } from '../../common/client';
import { nuelinkPosts } from '../../common/operations';
import { nuelinkOutputSchemas } from '../../output-schemas';

export const aiCreatePost = createAction({
  name: 'nuelink_create_post',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Create Post',
  description: 'Creates a post (caption, poll or both) in a Nuelink collection as a draft, in the queue, scheduled or published now.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a post in a collection; it goes to every channel of that collection (check them with nuelink_list_collections). publishMode defaults to DRAFT; use IMMEDIATE only when the user explicitly asks to post now, and QUEUE or SCHEDULE only on explicit intent to publish. scheduledAt must be ISO-8601 with an offset (e.g. 2026-10-12T09:00:00+03:00), at least 10 minutes ahead; it is converted to the brand timezone from nuelink_list_brands. Needs a caption, a poll, or both; polls cannot be edited later and only reach LinkedIn, X, Telegram, Threads, Mastodon and Bluesky. Each call creates a new post: after a timeout, check nuelink_list_brand_posts before retrying.',
    idempotent: false,
  },
  props: {
    brandId: nuelinkAiProps.brandId(),
    collectionId: nuelinkAiProps.collectionId({ required: true, description: 'The numeric collection ID from nuelink_list_collections. The post goes to every channel in it.' }),
    publishMode: Property.StaticDropdown({
      displayName: 'Publish Mode',
      description: 'DRAFT (default) saves without publishing, QUEUE takes the next free slot, SCHEDULE publishes at Scheduled Time, IMMEDIATE publishes now.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Queue', value: 'QUEUE' },
          { label: 'Schedule', value: 'SCHEDULE' },
          { label: 'Publish Now', value: 'IMMEDIATE' },
        ],
      },
    }),
    scheduledAt: Property.ShortText({
      displayName: 'Scheduled Time',
      description: 'Only with Publish Mode SCHEDULE. ISO-8601 with an offset or Z, e.g. 2026-10-12T09:00:00+03:00.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Post text, up to 3,000 characters. Optional when a poll is set.',
      required: false,
    }),
    title: Property.ShortText({ displayName: 'Title', description: 'Title for videos, Reels and Pinterest pins (up to 255 characters).', required: false }),
    media: Property.Array({
      displayName: 'Media',
      description: 'Up to 10 entries: public http(s) URLs, or media IDs from nuelink_upload_file or nuelink_list_media.',
      required: false,
    }),
    alt: Property.ShortText({ displayName: 'Alt Text', description: 'Alt text for the media (up to 255 characters).', required: false }),
    link: Property.ShortText({ displayName: 'Link', description: 'Destination link for Pinterest pins and the Google Business button.', required: false }),
    postAsStory: Property.Checkbox({ displayName: 'Post as Story', description: 'Publish as a story where supported.', required: false }),
    autoThreadText: Property.Checkbox({ displayName: 'Split Long Text into a Thread', description: 'Let Nuelink split long text into a thread.', required: false }),
    firstComment: Property.LongText({ displayName: 'First Comment', description: 'Comment added after publishing (up to 1,000 characters). Needs First Comment Delay.', required: false }),
    firstCommentDelaySeconds: Property.Number({ displayName: 'First Comment Delay (seconds)', description: 'Seconds after publishing to add the first comment.', required: false }),
    pollQuestion: Property.ShortText({ displayName: 'Poll Question', description: 'Up to 280 characters. Setting any poll field requires Question, Options and Duration.', required: false }),
    pollOptions: Property.Array({ displayName: 'Poll Options', description: '2 to 4 answers, each up to 30 characters.', required: false }),
    pollPeriod: Property.StaticDropdown({
      displayName: 'Poll Duration',
      required: false,
      options: {
        options: [
          { label: '1 day', value: '1d' },
          { label: '3 days', value: '3d' },
          { label: '7 days', value: '7d' },
        ],
      },
    }),
    pollCorrectOptionIndex: Property.Number({ displayName: 'Poll Correct Option Index', description: 'Zero-based index of the correct answer, for quiz polls.', required: false }),
    pollExplanation: Property.LongText({ displayName: 'Poll Explanation', description: 'Shown with the correct answer (up to 512 characters).', required: false }),
    instagramShareToFeed: Property.Checkbox({ displayName: 'Instagram: Share Reel to Feed', required: false }),
    instagramCollab: Property.ShortText({ displayName: 'Instagram: Collaborator', description: 'Instagram username to invite as collaborator.', required: false }),
    tiktokAutoAddMusic: Property.Checkbox({ displayName: 'TikTok: Add Music Automatically', required: false }),
    youtubeTags: Property.Array({ displayName: 'YouTube: Tags', required: false }),
  },
  outputSchema: nuelinkOutputSchemas.createCollectionPost,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brandId, label: 'Brand ID' });
    const collectionId = nuelinkClient.numericId({ value: context.propsValue.collectionId, label: 'Collection ID' });
    return nuelinkPosts.create({ apiKey, brandId, collectionId, props: context.propsValue, pollAllowed: true });
  },
});
