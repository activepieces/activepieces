import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataListYoutubeChannelVideosOutputSchema } from '../output-schemas';

export const listYoutubeChannelVideosAction = createAction({
  name: 'supadata_list_youtube_channel_videos',
  outputSchema: supadataListYoutubeChannelVideosOutputSchema,
  displayName: 'List YouTube Channel Videos',
  description: 'Lists video ids of a YouTube channel.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the ids of videos, shorts and live streams on a YouTube channel, optionally limited to one type. Returns ids only; pass them to supadata_get_youtube_video for details. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Channel ID, Handle or URL',
      description: 'YouTube channel URL, handle (e.g. @name) or id.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of ids to return.',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Which kind of videos to list.',
      required: false,
      options: { disabled: false, options: [{ label: 'all', value: 'all' }, { label: 'video', value: 'video' }, { label: 'short', value: 'short' }, { label: 'live', value: 'live' }] },
    }),
  },
  async run(context) {
    const { id, limit, type } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/youtube/channel/videos',
      query: { id, limit, type },
    });
  },
});
