import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataGetYoutubePlaylistOutputSchema } from '../output-schemas';

export const getYoutubePlaylistAction = createAction({
  name: 'supadata_get_youtube_playlist',
  outputSchema: supadataGetYoutubePlaylistOutputSchema,
  displayName: 'Get YouTube Playlist',
  description: 'Fetches metadata of a YouTube playlist.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns metadata of a YouTube playlist (title, description, video count, view count, channel) by playlist URL or id. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Playlist ID or URL',
      description: 'YouTube playlist URL or id.',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/youtube/playlist',
      query: { id },
    });
  },
});
