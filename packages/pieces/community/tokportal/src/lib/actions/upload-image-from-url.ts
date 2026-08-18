import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall } from '../common/client';
import { tokportalProps } from '../common/props';

export const uploadImageFromUrl = createAction({
  auth: tokportalAuth,
  name: 'upload_image_from_url',
  displayName: 'Upload Image From URL',
  description: 'Fetches a public direct image URL and stores it permanently in TokPortal storage.',
  audience: 'both',
  aiMetadata: {
    description:
      'Import a public image URL into TokPortal storage for a bundle and get back a storage_path usable as a carousel image in Configure Video or as a profile picture. Each call stores a new copy.',
    idempotent: false,
  },
  props: {
    bundleId: tokportalProps.bundleId(true),
    url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public direct image URL (JPEG, PNG, WebP or GIF), for example https://example.com/slide-1.jpg.',
      required: true,
    }),
    purpose: Property.StaticDropdown({
      displayName: 'Purpose',
      description: 'What the image is used for.',
      required: false,
      options: {
        options: [
          { label: 'Carousel slide', value: 'carousel' },
          { label: 'Profile picture', value: 'profile_picture' },
        ],
      },
    }),
  },
  async run(context) {
    const { bundleId, url, purpose } = context.propsValue;
    const response = await tokportalApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/upload/image/from-url',
      body: {
        bundle_id: bundleId,
        url,
        purpose: purpose || undefined,
      },
    });
    return response.data ?? response;
  },
});
