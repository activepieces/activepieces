import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { heygenApiCall } from '../common/client';
import { heygenAuth } from '../common/auth';

export const retrieveVideoStatusAction = createAction({
  auth: heygenAuth,
  name: 'retrieve_video_status',
  displayName: 'Retrieve Video Status',
  description: 'Retrieve the status and details of a video using its ID.',
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'The ID of the video to retrieve the status for.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { videoId } = propsValue;

    const response = await heygenApiCall({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: `/video_status.get`,
      query: { video_id: videoId },
      apiVersion: 'v1',
    });

    return response;
  },
});
