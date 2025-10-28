import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { heygenAuth } from '../common/auth';
import { heygenApiCall } from '../common/client';

export const retrieveTranslatedVideoStatus = createAction({
  auth: heygenAuth,
  name: 'retrieve-translated-video-status',
  displayName: 'Retrieve Translated Video Status',
  description: 'Retrieves the status of a translated video.',
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
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: `/video_translate/${videoId}`,
      apiVersion: 'v2',
    });

    return response;
  },
});
