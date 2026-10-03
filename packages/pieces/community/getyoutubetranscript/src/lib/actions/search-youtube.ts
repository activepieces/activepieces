import { createAction, Property } from '@activepieces/pieces-framework';
import { getYoutubeTranscriptAuth } from '../auth';
import { getYoutubeTranscriptRequest } from '../common/client';

export const searchYoutubeAction = createAction({
  name: 'search_youtube',
  classification: 'READ',
  displayName: 'Search YouTube',
  description: 'Searches YouTube for videos or channels.',
  audience: 'both',
  aiMetadata: {
    description:
      "Searches YouTube for videos or channels matching a query and returns each result's title, video or channel ID, link, channel, views, length and upload date. Pass the previous response's continuation token as Page Token to get the next page. Read-only and idempotent.",
    idempotent: true,
  },
  auth: getYoutubeTranscriptAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'What to search for.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Result Type',
      required: false,
      defaultValue: 'video',
      options: {
        options: [
          { label: 'Videos', value: 'video' },
          { label: 'Channels', value: 'channel' },
        ],
      },
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: "The continuation token from a previous search, to get the next page.",
      required: false,
    }),
  },
  async run(context) {
    const { query, type, pageToken } = context.propsValue;
    return getYoutubeTranscriptRequest(context.auth.secret_text, '/search', {
      q: query,
      type: type ?? undefined,
      page_token: pageToken ?? undefined,
    });
  },
});
