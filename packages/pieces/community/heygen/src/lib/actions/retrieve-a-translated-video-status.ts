import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { heygenAuth } from '../common/auth';
import { heygenApiCall } from '../common/client';

export const retrieveTranslatedVideoStatus = createAction({
  auth: heygenAuth,
  name: 'retrieve-translated-video-status',
  displayName: 'Retrieve Translated Video Status',
  description: 'Retrieves the status of a translated video.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up the current processing status (and result details) of a video-translation job by its translation video ID. Use to poll whether a previously submitted Translate Video job has completed. Read-only and idempotent. Note the ID here is the translate-job ID, distinct from the avatar-video ID used by Retrieve Video Status.',
    idempotent: true,
  },
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      required: true,
      description: 'The ID of the translated video to check the status for.',
    }),
  },
  async run({ propsValue, auth }) {
    const { videoId } = propsValue;

    const response = await heygenApiCall({
			apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/video_translate/${videoId}`,
      apiVersion: 'v2',
    });

    return response;
  },
});
