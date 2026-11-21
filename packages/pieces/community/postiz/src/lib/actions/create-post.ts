import { createAction, Property } from '@activepieces/pieces-framework';
import { postizAuth } from '../common/auth';
import { postizCommon, requireText } from '../common';
import { createPostizPost, parseDate, PostizPostType } from '../common/post-body';

function toPostType({ value }: { value: unknown }): PostizPostType {
  if (value === 'now' || value === 'schedule' || value === 'draft') {
    return value;
  }
  throw new Error('Post Type must be "schedule", "now" or "draft".');
}

export const createPost = createAction({
  auth: postizAuth,
  name: 'create_post',
  classification: 'WRITE',
  displayName: 'Create Post',
  description: 'Create or schedule a post on one or more connected channels',
  audience: 'human',
  outputSchema: {
    fields: [
      { key: 'postId', label: 'Post ID' },
      { key: 'integration', label: 'Channel ID' },
    ],
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Post Type',
      description: 'Choose whether to publish immediately, schedule for later, or save as draft',
      required: true,
      defaultValue: 'schedule',
      options: {
        options: [
          { label: 'Schedule for later', value: 'schedule' },
          { label: 'Publish now', value: 'now' },
          { label: 'Save as draft', value: 'draft' },
        ],
      },
    }),
    date: Property.DateTime({
      displayName: 'Publish Date',
      description: 'When to publish, required for scheduled posts.',
      required: false,
    }),
    integration: postizCommon.integrationDropdown,
    content: Property.LongText({
      displayName: 'Content',
      description: 'The text content of the post',
      required: true,
    }),
    media: Property.Array({
      displayName: 'Media Paths',
      description: 'Media IDs or paths from Upload File from URL or List Media.',
      required: false,
    }),
    shortLink: Property.Checkbox({
      displayName: 'Shorten Links',
      description: 'Automatically shorten URLs in the post content',
      required: false,
      defaultValue: false,
    }),
    settings: Property.Json({
      displayName: 'Settings',
      description: 'Optional platform-specific settings for the post.',
      required: false,
    }),
  },
  async run(context) {
    const { date, integration, content, media, shortLink, settings } = context.propsValue;
    const type = toPostType({ value: context.propsValue.type });
    const publishDate = parseDate({ value: date, label: 'Publish Date' });
    if (type === 'schedule' && publishDate === undefined) {
      throw new Error('A Publish Date is required when Post Type is "Schedule for later".');
    }
    if (type === 'schedule' && publishDate !== undefined && new Date(publishDate).getTime() <= Date.now()) {
      throw new Error(`Publish Date must be in the future when Post Type is "Schedule for later", got ${publishDate}.`);
    }

    const results = await createPostizPost({
      auth: context.auth,
      type,
      date: publishDate,
      integrationId: requireText({ value: integration, label: 'Channel' }),
      content: requireText({ value: content, label: 'Content' }),
      media,
      shortLink: shortLink ?? false,
      settings,
    });

    if (results.length === 1) {
      return results[0];
    }
    return results;
  },
});
