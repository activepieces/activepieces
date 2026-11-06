import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { socialkitAuth } from '../auth';
const socialkitApiUrl = 'https://api.socialkit.dev';

export const getYoutubeTranscript = createAction({
  name: 'get_youtube_transcript',
  classification: 'READ',
  auth: socialkitAuth,
  displayName: 'Get YouTube Transcript',
  description:
    "Get a video's full transcript with timestamps; needs captions.",
  audience: 'both',
  aiMetadata: { description: 'Retrieves the full timestamped transcript of a YouTube video from its watch URL. Use when you need the spoken text/captions for downstream summarization, search, or analysis. Read-only and idempotent; only works for videos that have captions or subtitles available.', idempotent: true },
  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description: "Copy it from the video's page in your browser.",
      placeholder: 'https://www.youtube.com/watch?v=VIDEO_ID',
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