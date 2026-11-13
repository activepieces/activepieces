import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinaryConcatenateVideosOutputSchema } from '../../output-schemas';

export const cloudinaryConcatenateVideos = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_concatenate_videos',
  outputSchema: cloudinaryConcatenateVideosOutputSchema,
  displayName: 'Concatenate Videos',
  description: 'Joins video segments, in order, into a single MP4 asset.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Concatenates two or more videos, given as ordered URLs, into one new MP4 video asset. Processing is asynchronous: the response has status and public_id; call Get Resource (resource type video) on the public_id to check when it is ready. Not idempotent.',
    idempotent: false,
  },
  props: {
    urls: Property.Array({ displayName: 'Video URLs', description: 'At least two video URLs, in playback order.', required: true }),
    public_id: Property.ShortText({ displayName: 'Public ID', description: 'Public ID for the combined video. Leave empty for a random ID.', required: false }),
    asset_folder: Property.ShortText({ displayName: 'Asset Folder', description: 'Folder for the combined video.', required: false }),
    notification_url: Property.ShortText({ displayName: 'Notification URL', description: 'Webhook URL called when processing finishes.', required: false }),
  },
  async run({ auth, propsValue }) {
    const urls = aiResults.requireItems({ values: propsValue.urls, label: 'video URLs', max: 100 });
    if (urls.length < 2) {
      throw new Error('Provide at least two video URLs.');
    }
    return makeRequest(auth, HttpMethod.POST, '/video/concat', {
      urls,
      ...(propsValue.public_id ? { public_id: propsValue.public_id.trim() } : {}),
      ...(propsValue.asset_folder ? { asset_folder: propsValue.asset_folder.trim() } : {}),
      ...(propsValue.notification_url ? { notification_url: propsValue.notification_url.trim() } : {}),
    });
  },
});
