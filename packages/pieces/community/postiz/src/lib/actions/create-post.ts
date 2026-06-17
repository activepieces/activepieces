import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall, postizCommon } from '../common';

export const createPost = createAction({
  auth: postizAuth,
  name: 'create_post',
  displayName: 'Create Post',
  description: 'Create or schedule a post on one or more connected channels',
  audience: 'both',
  aiMetadata: {
    description: 'Publishes content to a connected social channel in one of three modes selectable via the post type: publish immediately, schedule for a future date, or save as a draft. Use to push a message out through Postiz; a publish date is required when scheduling, and media must be a path returned by the Upload File from URL action. Not idempotent — each call creates a new post.',
    idempotent: false,
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
      description:
        'The date and time to publish the post (ISO 8601 format). Required for scheduled posts.',
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
      description:
        'File paths of images or videos to attach. Upload media first using the "Upload File from URL" action, then paste the returned path here.',
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
      description: 'Optional platform-specific settings (e.g. approval workflow overrides)',
      required: false,
    }),
  },
  async run(context) {
    const { type, date, integration, content, media, shortLink, settings } = context.propsValue;
    const auth = context.auth;

    const value: Record<string, unknown> = { content };

    if (media && (media as string[]).length > 0) {
      value['image'] = (media as string[]).map((path) => ({ path }));
    }

    const postItem: Record<string, unknown> = {
      integration: { id: integration },
      value: [value],
    };

    if (settings) {
      postItem['settings'] = settings;
    }

    const body: Record<string, unknown> = {
      type,
      shortLink: shortLink ?? false,
      posts: [postItem],
    };

    if (type === 'schedule') {
      if (!date) {
        throw new Error(
          'A Publish Date is required when Post Type is "Schedule for later".',
        );
      }
      body['date'] = date;
    }

    const response = await postizApiCall<Record<string, unknown>[]>({
      auth,
      method: HttpMethod.POST,
      path: '/posts',
      body,
    });

    const results = response.body;
    if (Array.isArray(results) && results.length === 1) {
      return results[0];
    }
    return results;
  },
});
