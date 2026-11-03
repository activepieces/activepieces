import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropParseUrlOutputSchema } from '../../../output-schemas';

export const raindropParseUrlAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_parse_url',
  outputSchema: raindropParseUrlOutputSchema,
  displayName: 'Parse URL',
  description: 'Extracts title, excerpt, media and type from any URL without saving it.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches a URL and returns what Raindrop.io would parse from it (title, excerpt, cover media, type, canonical link) without saving anything. Use it to preview a page before Create Bookmark; use Check URLs Exist to see whether a URL is already saved. Fails when the URL is unreachable or invalid.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The URL to parse, e.g. "https://example.com/article".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await raindropClient.request<RaindropParseUrlResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/import/url/parse',
      query: { url: propsValue.url },
    });
    if (response.error) {
      throw new Error(
        `Raindrop could not parse ${propsValue.url}: ${response.errorMessage ?? response.error}`,
      );
    }
    return response;
  },
});

type RaindropParseUrlResponse = {
  result: boolean;
  item: Record<string, unknown>;
  error?: string;
  errorMessage?: string;
};
