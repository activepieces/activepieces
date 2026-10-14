import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';

export const findLinksByOriginalUrlAction = createAction({
  auth: shortIoAuth,
  name: 'find_links_by_original_url',
  displayName: 'Find Links by Original URL',
  description: 'Find every short link on a domain that points to a given long URL.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds all short links on a domain whose destination (original URL) exactly equals the given URL. Use to check whether a URL was already shortened before creating a new link. Returns an empty list when none match. Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.linksByUrl,
  props: {
    domain: shortIoAiProps.domain(),
    originalURL: Property.ShortText({
      displayName: 'Original URL',
      description: 'The full destination URL to look up, exactly as it was shortened.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const originalURL = propsValue.originalURL.trim();
    if (!originalURL) {
      throw new Error('Original URL is required.');
    }
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    try {
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.GET,
        path: '/links/multiple-by-url',
        query: { domain: domain.hostname, originalURL },
      });
      const raw = shortIoLinks.isRecord(response) && Array.isArray(response['links']) ? response['links'] : response;
      const items = shortIoLinks.scrubLinks(raw);
      return { items, count: items.length };
    } catch (error) {
      if (shortIoClient.errorStatus(error) === 404) {
        return { items: [], count: 0 };
      }
      return shortIoClient.rethrowWithHint({ error, hints: {} });
    }
  },
});
