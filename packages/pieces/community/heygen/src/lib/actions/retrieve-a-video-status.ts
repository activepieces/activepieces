import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { heygenApiCall } from '../common/client';
import { heygenAuth } from '../common/auth';

export const retrieveVideoStatusAction = createAction({
  auth: heygenAuth,
  name: 'retrieve_video_status',
  displayName: 'Retrieve Video Status',
  description: 'Retrieve the status and details of a video using its ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up the processing status and details (including the output URL once ready) of an avatar/template-generated video by its video ID. Use to poll whether a generation job has finished before downloading or sharing. Read-only and idempotent. For video-translation jobs use Retrieve Translated Video Status instead.',
    idempotent: true,
  },
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
			apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/video_status.get`,
      query: { video_id: videoId },
      apiVersion: 'v1',
    });

    return response;
  },
});
