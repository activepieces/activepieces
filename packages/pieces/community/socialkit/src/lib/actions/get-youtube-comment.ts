import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { socialkitAuth } from '../auth';

const socialkitApiUrl = 'https://api.socialkit.dev';

export const getYoutubeComments = createAction({
  auth: socialkitAuth,
  name: 'get_youtube_comments',
  classification: 'SEARCH',
  displayName: 'Get YouTube Comments',
  description:
    "Get a video's comments, newest or top first.",
  audience: 'both',
  aiMetadata: { description: 'Fetches comments for a YouTube video given its watch URL, optionally capped by a limit (default 10, max 100) and ordered newest-first or by top engagement. Use to read audience reactions or feed comment text into analysis. Read-only and idempotent, though results may shift as new comments are posted.', idempotent: true },
  propertyGroups: [
    {
      key: 'video',
      display: 'section',
      label: 'Video',
      icon: 'file',
      props: ['url'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'sliders',
      props: ['limit', 'sortBy'],
    },
  ],
  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description: "Copy it from the video's page in your browser.",
      placeholder: 'https://www.youtube.com/watch?v=VIDEO_ID',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Max Comments',
      description: 'How many comments to fetch, up to 100.',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 100,
      step: 1,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Top puts the most-engaged comments first.',
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
