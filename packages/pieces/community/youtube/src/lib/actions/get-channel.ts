import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { getChannelOutputSchema } from '../output-schemas';

export const youtubeGetChannelAction = createAction({
  auth: youtubeAuth,
  outputSchema: getChannelOutputSchema,
  name: 'get_channel',
  classification: 'READ',
  displayName: 'Get Channel',
  description: 'Retrieve a channel by ID or handle, including its subscriber and view counts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a YouTube channel using channels.list, by channel ID or by @handle, returning title, description, country, subscriber count, view count and video count. Use it to resolve a channel reference into its statistics or its uploads playlist ID. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    channelId: Property.ShortText({
      displayName: 'Channel ID',
      description: 'Channel ID starting with `UC`. Leave blank if using a handle.',
      required: false,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'Channel handle such as `@GoogleDevelopers`. Ignored when a Channel ID is given.',
      required: false,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { channelId, handle } = context.propsValue;

    if (!channelId && !handle) {
      throw new Error('Provide either a Channel ID or a Handle.');
    }

    const queryParams: Record<string, string> = {
      part: 'snippet,contentDetails,statistics',
    };
    if (channelId) {
      queryParams['id'] = channelId;
    } else if (handle) {
      queryParams['forHandle'] = handle.startsWith('@') ? handle : `@${handle}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://www.googleapis.com/youtube/v3/channels',
      headers: { Authorization: `Bearer ${accessToken}` },
      queryParams,
    });

    return response.body;
  },
});
