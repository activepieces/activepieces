import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { heygenAuth } from '../../index';

export const retrieveTranslatedVideoStatus = createAction({
  auth: heygenAuth,
  name: 'get_translated_video_status',
  displayName: 'Get Translated Video Status',
  description: 'Track the progress and status of your video translations in real-time.',
  props: {
    videoTranslateId: Property.ShortText({
      displayName: 'Video Translate ID',
      required: true,
      description: 'The ID of the translated video to check the status of.',
    }),
  },
  async run({ propsValue, auth }) {
    const apiKey = auth as string;
    const videoTranslateId = propsValue.videoTranslateId;

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/v2/video_translate/${videoTranslateId}`
    );

    return response;
  },
});
