import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { SocialKitAuth } from '../common/auth';

export const getYoutubeSummary = createAction({
  auth: SocialKitAuth,
  name: 'getYoutubeSummary',
  displayName: 'Get YouTube Summary',
  description:
    'Generate an AI-powered summary and key insights from a YouTube video using SocialKit.',
  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description: 'Enter the full YouTube video URL ',
      required: true,
    }),
    custom_response: Property.ShortText({
      displayName: 'Custom Response Format ',
      description:
        'Define custom fields for the AI response (e.g., { "sentiment": "Overall sentiment", "category": "Genre" }).',
      required: false,
    }),

    custom_prompt: Property.LongText({
      displayName: 'Custom Prompt ',
      description:
        'Provide custom AI instructions (e.g., "Make it concise" or "Write in a friendly tone").',
      required: false,
    }),
    cache_ttl: Property.Number({
      displayName: 'Cache TTL (in seconds)',
      description: 'Set custom TTL for cache (minimum: 3600, maximum: 2592000).',
      required: false,
    }),
    cache: Property.Checkbox({
      displayName: 'Enable Caching',
      description: 'Cache the response for faster subsequent requests (default: false).',
      required: false,
      defaultValue: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { url, custom_response, custom_prompt, cache, cache_ttl } = propsValue;

    const queryParams = new URLSearchParams({
      url,
      ...(cache ? { cache: 'true' } : {}),
      ...(cache_ttl ? { cache_ttl: cache_ttl.toString() } : {}),
    });

    const body: Record<string, unknown> = {};
    if (custom_response) body['custom_response'] = custom_response;
    if (custom_prompt) body['custom_prompt'] = custom_prompt;


    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/youtube/summarize?${queryParams.toString()}`,
      Object.keys(body).length > 0 ? body : undefined
    );

    return response;
  },
});
