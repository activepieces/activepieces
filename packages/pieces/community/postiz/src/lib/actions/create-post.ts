import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../../';
import { postizApiCall, PostizAuth, postizCommon } from '../common';

export const createPost = createAction({
  auth: postizAuth,
  name: 'create_post',
  displayName: 'Create Post',
  description: 'Create or schedule a post on one or more connected channels',
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
      displayName: 'Media URLs',
      description:
        'URLs of images or videos to attach. Upload media first using the "Upload File from URL" action, then paste the returned path here.',
      required: false,
    }),
    shortLink: Property.Checkbox({
      displayName: 'Shorten Links',
      description: 'Automatically shorten URLs in the post content',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { type, date, integration, content, media, shortLink } = context.propsValue;
    const auth = context.auth as PostizAuth;

    const postItem: Record<string, unknown> = {
      content,
      integration: { id: integration },
    };

    if (media && (media as string[]).length > 0) {
      postItem['image'] = (media as string[]).map((url) => ({ url }));
    }

    const body: Record<string, unknown> = {
      type,
      shortLink: shortLink ?? false,
      posts: [postItem],
    };

    if (type === 'schedule' && date) {
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
