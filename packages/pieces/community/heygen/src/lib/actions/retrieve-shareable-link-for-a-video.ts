import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { heygenApiCall } from '../common/client';
import { heygenAuth } from '../common/auth';

export const retrieveSharableVideoUrlAction = createAction({
  auth: heygenAuth,
  name: 'retrieve_sharable_video_url',
  displayName: 'Retrieve Sharable Video URL',
  description: 'Generates a public URL for a video, allowing it to be shared and accessed publicly.',
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'The ID of the video to generate a shareable URL for.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { videoId } = propsValue;

    const response = await heygenApiCall({
      apiKey: auth as string,
      method: HttpMethod.POST,
      resourceUri: '/video/share',
      body: { video_id: videoId },
      apiVersion: 'v1',
    });

    return response;
  },
});
