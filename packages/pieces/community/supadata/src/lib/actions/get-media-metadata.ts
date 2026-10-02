import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataGetMediaMetadataOutputSchema } from '../output-schemas';

export const getMediaMetadataAction = createAction({
  name: 'supadata_get_media_metadata',
  outputSchema: supadataGetMediaMetadataOutputSchema,
  displayName: 'Get Media Metadata',
  description: 'Fetches metadata of a post or video on YouTube, TikTok, Instagram, X or Facebook.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns unified metadata (title, author, stats, media, tags) for a social media post or video from YouTube, TikTok, Instagram, X (Twitter) or Facebook given its URL. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Media URL',
      description: 'URL of the post or video.',
      required: true,
    }),
  },
  async run(context) {
    const { url } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/metadata',
      query: { url },
    });
  },
});
