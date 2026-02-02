import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { socialkitAuth } from '../..';
const socialkitApiUrl = 'https://api.socialkit.dev';

export const getYoutubeTranscript = createAction({
  name: 'get_youtube_transcript',
  auth: socialkitAuth,
  displayName: 'Get YouTube Transcript',
  description:
    'Extract the full transcript with timestamps from any YouTube video that has captions or subtitles available.',
  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description:
        'The URL of the YouTube video to get the transcript from. (e.g., https://www.youtube.com/watch?v=VIDEO_ID)',
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
        access_key: accessKey.secret_text,
        url: url,
      },
    });

    return response.body.data;
  },
});