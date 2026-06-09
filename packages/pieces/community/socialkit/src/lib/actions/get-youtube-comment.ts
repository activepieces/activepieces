import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { socialkitAuth } from '../auth';

const socialkitApiUrl = 'https://api.socialkit.dev';

export const getYoutubeComments = createAction({
  auth: socialkitAuth,
  name: 'get_youtube_comments',
  displayName: 'Get YouTube Comments',
  description:
    'Fetch comments from  YouTube video with options to sort and limit results.',
  audience: 'both',
  aiMetadata: { description: 'Fetches comments for a YouTube video given its watch URL, optionally capped by a limit (default 10, max 100) and ordered newest-first or by top engagement. Use to read audience reactions or feed comment text into analysis. Read-only and idempotent, though results may shift as new comments are posted.', idempotent: true },
  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description:
        'The URL of the YouTube video to fetch comments from. (e.g., https://www.youtube.com/watch?v=VIDEO_ID)',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'The number of comments to retrieve (default is 10, maximum is 100).',
      required: false,
      defaultValue: 10,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'The sorting order for the comments.',
      required: false,
      options: {
        options: [
          { label: 'Newest', value: 'new' },
          { label: 'Top', value: 'top' },
        ],
      },
      defaultValue: 'new',
    }),
  },
  async run(context) {
    const { url, limit, sortBy } = context.propsValue;
    const accessKey = context.auth;

    const queryParams: Record<string, string> = {
      access_key: accessKey.secret_text,
      url: url,
    };

    if (limit) {
      queryParams['limit'] = limit.toString();
    }
    if (sortBy) {
      queryParams['sortBy'] = sortBy;
    }

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: unknown;
    }>({
      method: HttpMethod.GET,
      url: `${socialkitApiUrl}/youtube/comments`,
      queryParams: queryParams,
    });

    return response.body.data;
  },
});
