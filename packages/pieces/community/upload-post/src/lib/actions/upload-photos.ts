import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uploadPostAuth } from '../auth';
import { uploadPostClient } from '../common/client';
import {
  PHOTO_PLATFORMS,
  profileDropdown,
  uploadPostForm,
  uploadPostProps,
} from '../common/props';

export const uploadPhotos = createAction({
  auth: uploadPostAuth,
  name: 'upload_photos',
  classification: 'WRITE',
  displayName: 'Upload Photos',
  description:
    'Publish or schedule one photo or a carousel from public URLs to Instagram, TikTok, Facebook, LinkedIn, X and more.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publish (or schedule) a single image or a carousel, given as public image URLs, to one or more social platforms connected to an Upload-Post profile. Use Upload Video for a video and Upload Text for text-only posts. Each call creates new posts, so retries publish duplicates.',
    idempotent: false,
  },
  props: {
    profile: profileDropdown,
    platforms: uploadPostProps.platforms({
      options: PHOTO_PLATFORMS,
      description:
        'Where to publish. Every selected platform must be connected to the chosen profile.',
    }),
    photo_urls: Property.Array({
      displayName: 'Photo URLs',
      description:
        'Public URLs of the images, in carousel order. Add more than one to create a carousel.',
      required: true,
    }),
    ...uploadPostProps.publishing({
      titleDisplayName: 'Title / Caption',
      titleDescription: 'Default title or caption used on every platform.',
      titleRequired: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description:
        'Optional longer text. Used as the TikTok photo description, LinkedIn commentary, Facebook description and Pinterest note. Ignored by other platforms.',
      required: false,
    }),
    pinterest_board_id: uploadPostProps.pinterestBoard(),
  },
  async run(context) {
    const { profile, platforms, photo_urls, pinterest_board_id } =
      context.propsValue;
    const urls = photo_urls
      .map((url) => String(url).trim())
      .filter((url) => url.length > 0);
    if (urls.length === 0) {
      throw new Error('Add at least one photo URL.');
    }
    const form = uploadPostForm.build({
      profile,
      platforms,
      fields: {
        ...uploadPostForm.commonFields(context.propsValue),
        pinterest_board_id: uploadPostForm.optionalString(pinterest_board_id),
      },
    });
    for (const url of urls) {
      form.append('photos[]', url);
    }
    const response = await uploadPostClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/upload_photos',
      body: form,
    });
    return response.body;
  },
});
