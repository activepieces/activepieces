import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { transcriptFetchAuth } from '../auth';
import { compact, transcriptFetchRequest } from '../common';

export const listChannelVideosAction = createAction({
  name: 'list_channel_videos',
  displayName: 'List Channel Videos',
  description: 'Lists the videos of a YouTube channel or a TikTok or Instagram profile, newest first.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: 'Lists recent videos (IDs, titles, dates, URLs) from a YouTube channel or a TikTok or Instagram profile via the TranscriptFetch API, newest first, with a cursor for the next page. Read-only.',
    idempotent: true,
  },
  auth: transcriptFetchAuth,
  props: {
    channel: Property.ShortText({
      displayName: 'Channel or Profile',
      description: 'A channel or profile URL, or a YouTube @handle or channel ID.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Videos to return (1 to 50).',
      required: false,
      defaultValue: 50,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'The next_cursor from a previous call, to get the next page.',
      required: false,
    }),
    since_video_id: Property.ShortText({
      displayName: 'Since Video ID',
      description: 'Only return videos newer than this one.',
      required: false,
    }),
  },
  async run(context) {
    const { channel, limit, cursor, since_video_id } = context.propsValue;
    return transcriptFetchRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v2/transcripts/channel',
      body: compact({ channel, limit: Math.min(Math.max(limit ?? 50, 1), 50), cursor, since_video_id }),
    });
  },
});
