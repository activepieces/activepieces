import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { socialkitAuth } from '../auth';

const socialkitApiUrl = 'https://api.socialkit.dev';

export const getYoutubeSummary = createAction({
  auth: socialkitAuth,
  name: 'get_youtube_summary',
  displayName: 'Get YouTube Summary',
  description: 'Generates an AI-powered summary of a YouTube video.',
  audience: 'both',
  aiMetadata: { description: 'Returns an AI-generated summary of a YouTube video given its watch URL. Use when you want the gist of a video without processing the raw transcript yourself. The summary is derived server-side from the video; the call is read-only and idempotent for a given URL.', idempotent: true },
  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description: 'The URL of the YouTube video to summarize. (e.g., https://www.youtube.com/watch?v=VIDEO_ID)',
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
      url: `${socialkitApiUrl}/youtube/summarize`,
      queryParams: {
        access_key: accessKey.secret_text,
        url: url,
      },
    });

    return response.body.data;
  },
});