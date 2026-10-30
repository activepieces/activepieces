import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataListYoutubeChannelVideosOutputSchema } from '../output-schemas';

export const listYoutubePlaylistVideosAction = createAction({
  name: 'supadata_list_youtube_playlist_videos',
  outputSchema: supadataListYoutubeChannelVideosOutputSchema,
  displayName: 'List YouTube Playlist Videos',
  description: 'Lists video ids of a YouTube playlist.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the ids of the videos in a YouTube playlist. Returns ids only; pass them to supadata_get_youtube_video for details. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Playlist ID or URL',
      description: 'YouTube playlist URL or id.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of ids to return.',
      required: false,
    }),
  },
  async run(context) {
    const { id, limit } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/youtube/playlist/videos',
      query: { id, limit },
    });
  },
});
