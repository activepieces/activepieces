import { createAction, Property } from '@activepieces/pieces-framework';
import { nuelinkAuths } from '../auth';
import { nuelinkClient } from '../common/client';
import { nuelinkPosts } from '../common/operations';
import { nuelinkProps } from '../common/props';
import { nuelinkOutputSchemas } from '../output-schemas';

export const createCollectionPost = createAction({
  name: 'create_collection_post',
  classification: 'WRITE',
  auth: nuelinkAuths,
  displayName: 'Create Post in Collection',
  description: 'Creates a post in a Nuelink collection as a draft, in the queue, at a scheduled time or right away. It goes to every channel in the collection.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a post in a Nuelink collection; it goes to every channel connected to that collection. DRAFT (the default) saves without publishing, QUEUE takes the collection\'s next time slot, SCHEDULE needs scheduledAt at least 10 minutes ahead, and IMMEDIATE publishes now. Use IMMEDIATE only when the user explicitly asks to post now. Each call creates a new post, so do not retry after a timeout without checking List Posts first.',
    idempotent: false,
  },
  props: {
    brand: nuelinkProps.brand(),
    collection: nuelinkProps.collection({ required: true, description: 'The collection to add the post to. The post is published to every channel connected to it.' }),
    publishMode: Property.StaticDropdown({
      displayName: 'Publish Mode',
      description: 'Draft saves the post without publishing it. Queue gives it the collection\'s next free time slot. Schedule publishes it at Scheduled Time. Publish Now sends it to every channel immediately.',
      required: true,
      defaultValue: 'DRAFT',
      options: {
        options: [
          { label: 'Draft (do not publish)', value: 'DRAFT' },
          { label: 'Add to Queue', value: 'QUEUE' },
          { label: 'Schedule', value: 'SCHEDULE' },
          { label: 'Publish Now', value: 'IMMEDIATE' },
        ],
      },
    }),
    scheduledAt: Property.DateTime({
      displayName: 'Scheduled Time',
      description: 'Only for Publish Mode = Schedule, at least 10 minutes ahead. Include a timezone offset; it is converted to the brand\'s timezone for Nuelink.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'The text of the post, up to 3,000 characters. Separating parts with two empty lines turns it into a thread (up to 10 parts).',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title used for videos, Reels and Pinterest pins (up to 255 characters).',
      required: false,
    }),
    media: Property.Array({
      displayName: 'Media',
      description: 'Up to 10 images or videos. Each entry is a public http(s) URL that Nuelink downloads (it must open without a login), or a media ID from Upload Media.',
      required: false,
    }),
    alt: Property.ShortText({
      displayName: 'Alt Text',
      description: 'Describes the image or video for screen readers (up to 255 characters).',
      required: false,
    }),
    link: Property.ShortText({
      displayName: 'Link',
      description: 'Destination link for Pinterest pins and the Google Business "Learn more" button.',
      required: false,
    }),
    postAsStory: Property.Checkbox({
      displayName: 'Post as Story',
      description: 'Publish as a story on channels that support stories.',
      required: false,
      defaultValue: false,
    }),
    autoThreadText: Property.Checkbox({
      displayName: 'Split Long Text into a Thread',
      description: 'Let Nuelink split text that is too long for a channel into a thread.',
      required: false,
      defaultValue: false,
    }),
    firstComment: Property.LongText({
      displayName: 'First Comment',
      description: 'A comment Nuelink adds under the post after it is published (up to 1,000 characters). Set First Comment Delay too.',
      required: false,
    }),
    firstCommentDelaySeconds: Property.Number({
      displayName: 'First Comment Delay (seconds)',
      description: 'How many seconds after publishing to post the first comment. Required when First Comment is set.',
      required: false,
    }),
    instagramShareToFeed: Property.Checkbox({
      displayName: 'Instagram: Share Reel to Feed',
      description: 'When on, Instagram Reels also appear in the feed. When off, Nuelink\'s default applies.',
      required: false,
      defaultValue: false,
    }),
    instagramCollab: Property.ShortText({
      displayName: 'Instagram: Collaborator',
      description: 'Instagram username to invite as a collaborator.',
      required: false,
    }),
    tiktokAutoAddMusic: Property.Checkbox({
      displayName: 'TikTok: Add Music Automatically',
      description: 'When on, TikTok adds music to photo posts. When off, Nuelink\'s default applies.',
      required: false,
      defaultValue: false,
    }),
    youtubeTags: Property.Array({
      displayName: 'YouTube: Tags',
      description: 'Tags for YouTube videos.',
      required: false,
    }),
  },
  outputSchema: nuelinkOutputSchemas.createCollectionPost,
  async run(context) {
    const apiKey = nuelinkClient.apiKeyOf({ auth: context.auth });
    const brandId = nuelinkClient.numericId({ value: context.propsValue.brand, label: 'Brand' });
    const collectionId = nuelinkClient.numericId({ value: context.propsValue.collection, label: 'Collection' });
    return nuelinkPosts.create({ apiKey, brandId, collectionId, props: context.propsValue, pollAllowed: false });
  },
});
