import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataStartVideoExtractionOutputSchema } from '../output-schemas';

export const startVideoExtractionAction = createAction({
  name: 'supadata_start_video_extraction',
  outputSchema: supadataStartVideoExtractionOutputSchema,
  displayName: 'Start Video Extraction',
  description: 'Starts an AI job extracting structured data from a video.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Starts an asynchronous AI job that analyses a video (YouTube, TikTok, Instagram, X, Facebook or a media file URL) and extracts data matching a prompt, a JSON Schema, or both. Provide at least one of Prompt or Schema. Returns a jobId: poll it with supadata_get_video_extraction_result. Not idempotent; uses credits.',
    idempotent: false,
  },
  auth: supadataAuth,
  props: {
    url: Property.ShortText({
      displayName: 'Video URL',
      description: 'URL of the video or media file.',
      required: true,
    }),
    prompt: Property.ShortText({
      displayName: 'Prompt',
      description: 'Describes what to extract.',
      required: false,
    }),
    schema: Property.Json({
      displayName: 'Schema',
      description: 'JSON Schema describing the output format.',
      required: false,
    }),
  },
  async run(context) {
    const { url, prompt, schema } = context.propsValue;
    if (!prompt && !schema) {
      throw new Error('Provide at least one of Prompt or Schema.');
    }
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.POST,
      path: '/extract',
      body: { url, prompt, schema },
    });
  },
});
