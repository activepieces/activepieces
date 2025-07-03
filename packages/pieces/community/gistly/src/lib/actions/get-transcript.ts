import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { gistlyAuth } from '../..';
import { gistlyConfig } from '../config';

export const getTranscriptAction = createAction({
  name: 'get_transcript',
  displayName: 'Get Transcript',
  description: 'Fetches transcript of a YouTube video.',
  auth: gistlyAuth,
  props: {
    url: Property.ShortText({
      displayName: 'YouTube URL',
      required: true,
    }),
    text: Property.Checkbox({
      displayName: 'Merge Text',
      description: 'If true, the transcript will be merged into a single text instead of timestamped chunks.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { url, text } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${gistlyConfig.baseUrl}/youtube/transcript`,
      headers: {
        [gistlyConfig.accessTokenHeaderKey]: context.auth,
      },
      queryParams: {
        url,
        text: text ? 'true' : 'false',
      },
    });

    return response.body;
  },
}); 