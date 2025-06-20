import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { heygenAuth } from '../../index';

export const retrieveSharableVideoUrlAction = createAction({
  auth: heygenAuth,
  name: 'retrieve_sharable_video_url',
  displayName: 'Retrieve Sharable Video URL',
  description: 'Generates a public URL for a video, allowing it to be shared and accessed publicly.',
  props: {
    video_id: Property.ShortText({
      displayName: 'Video ID',
      required: true,
    }),
  },
  async run(context) {
    const { video_id } = context.propsValue;

    const apiKey = context.auth as string;

    const body = {
      video_id,
    };

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/v1/video/share',
      body
    );

    return response;
  },
});
