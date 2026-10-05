import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataGetYoutubeChannelOutputSchema } from '../output-schemas';

export const getYoutubeChannelAction = createAction({
  name: 'supadata_get_youtube_channel',
  outputSchema: supadataGetYoutubeChannelOutputSchema,
  displayName: 'Get YouTube Channel',
  description: 'Fetches metadata of a YouTube channel.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns metadata of a YouTube channel (name, handle, description, subscriber, video and view counts) by channel URL, handle or id. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    id: Property.ShortText({
      displayName: 'Channel ID, Handle or URL',
      description: 'YouTube channel URL, handle (e.g. @name) or id.',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/youtube/channel',
      query: { id },
    });
  },
});
