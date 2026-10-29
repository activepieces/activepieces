import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataGetYoutubeVideoOutputSchema } from '../output-schemas';

export const getYoutubeVideoAction = createAction({
  name: 'supadata_get_youtube_video',
  outputSchema: supadataGetYoutubeVideoOutputSchema,
  displayName: 'Get YouTube Video',
  description: 'Fetches metadata of a YouTube video.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns metadata of one YouTube video (title, description, duration, channel, view and like counts, transcript languages) by id or URL. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Video ID or URL',
      description: 'YouTube video id or URL.',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/youtube/video',
      query: { id },
    });
  },
});
