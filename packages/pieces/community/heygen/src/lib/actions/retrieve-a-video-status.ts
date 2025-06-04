import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { heygenAuth } from '../../index';

export const retrieveVideoStatusAction = createAction({
  name: 'retrieve_video_status',
  displayName: 'Retrieve Video Status/Details',
  description: 'Retrieve the status and details of a video using its ID.',
  auth: heygenAuth,
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'The ID of the video to retrieve the status for.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const apiKey = auth as string;

    const body = {
      video_id: propsValue.videoId,
    };

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      '/v1/video_status.get',
      body
    );

    return response;
  },
});
