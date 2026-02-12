import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { baseUrl, tiktokAuth } from '../common';

export const postPhotos = createAction({
  name: 'postPhotos',
  displayName: 'Post Photos',
  description: 'Post photos to TikTok',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the post',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or caption of the post',
      required: true,
    }),
    disable_comment: Property.Checkbox({
      displayName: 'Disable Comments',
      description: 'Should comments be disabled on this post?',
      required: false,
    }),
    privacy_level: Property.StaticDropdown({
      displayName: 'Privacy Level',
      description: 'Privacy level of the post',
      required: true,
      options: {
        options: [
          { label: 'Public to Everyone', value: 'PUBLIC_TO_EVERYONE' },
          { label: 'Private', value: 'PRIVATE' },
          { label: 'Friends Only', value: 'FRIENDS' },
        ],
      },
    }),
    auto_add_music: Property.Checkbox({
      displayName: 'Auto Add Music',
      description: 'Automatically add music to the post',
      required: false,
    }),
    photo_cover_index: Property.Number({
      displayName: 'Photo Cover Index',
      description: 'Index of the photo to use as cover (1-based)',
      required: false,
    }),
    photo_images: Property.Array({
      displayName: 'Photo URLs',
      description: 'Array of photo URLs to post',
      required: true,
    }),
    post_mode: Property.StaticDropdown({
      displayName: 'Post Mode',
      description: 'How to post the content',
      required: true,
      options: {
        options: [
          { label: 'Direct Post', value: 'DIRECT_POST' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Schedule', value: 'SCHEDULE' },
        ],
      },
    }),
  },
  auth: tiktokAuth,
  async run(context) {
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/post/publish/content/init/`,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        post_info: {
          title: context.propsValue.title,
          description: context.propsValue.description,
          disable_comment: context.propsValue.disable_comment ?? false,
          privacy_level: context.propsValue.privacy_level,
          auto_add_music: context.propsValue.auto_add_music ?? false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_cover_index: context.propsValue.photo_cover_index ?? 1,
          photo_images: context.propsValue.photo_images,
        },
        post_mode: context.propsValue.post_mode,
        media_type: 'PHOTO',
      },
    });
    return res.body;
  },
});