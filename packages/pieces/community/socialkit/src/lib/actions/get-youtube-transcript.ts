import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { SocialKitAuth } from '../common/auth';

export const getYoutubeTranscript = createAction({
  auth: SocialKitAuth,
  name: 'getYoutubeTranscript',
  displayName: 'Get YouTube Transcript',
  description:
    'Retrieve the transcript (text + timestamps) of a YouTube video via SocialKits Transcript API.',

  props: {
    url: Property.ShortText({
      displayName: 'YouTube Video URL',
      description:
        'Enter the full YouTube video URL ',
      required: true,
    }),

    cache_ttl: Property.Number({
      displayName: 'Cache TTL (in seconds)',
      description:
        'Set custom TTL for cache (minimum: 3600, maximum: 2592000).',
      required: false,
    }),
    cache: Property.Checkbox({
      displayName: 'Enable Caching',
      description:
        'Cache the response for faster subsequent requests (default: false).',
      required: false,
      defaultValue: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { url, cache, cache_ttl } = propsValue;

    const queryParams = new URLSearchParams({
      url,
      ...(cache ? { cache: 'true' } : {}),
      ...(cache_ttl ? { cache_ttl: cache_ttl.toString() } : {}),
    });

    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/youtube/transcript?${queryParams.toString()}`
    );

    return response;
  },
});
