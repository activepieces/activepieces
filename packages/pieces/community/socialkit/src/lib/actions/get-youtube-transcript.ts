import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const socialkitApiUrl = 'https://api.socialkit.dev';

export const getYoutubeTranscript = createAction({
  name: 'get_youtube_transcript',
  displayName: 'Get YouTube Transcript',
  description: 'Retrieve the transcript (text + timestamps) of a YouTube video.',
  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description: 'The URL of the YouTube video to get the transcript from.',
      required: true,
    }),
  },
  async run(context) {
    const { url } = context.propsValue;
    const accessKey = context.auth;

    const response = await httpClient.sendRequest<{
        success: boolean;
        data: unknown;
    }>({
      method: HttpMethod.GET,
      url: `${socialkitApiUrl}/youtube/transcript`,
      queryParams: {
        access_key: accessKey as string,
        url: url,
      },
    });

    return response.body.data;
  },
});