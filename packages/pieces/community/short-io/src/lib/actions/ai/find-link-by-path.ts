import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../../common/auth';
import { shortIoLinkQueries } from '../../common/link-queries';
import { shortIoLinks } from '../../common/links';
import { shortIoSchemas } from '../../common/output-schemas';

export const findLinkByPathAiAction = createAction({
  auth: shortIoAuth,
  name: 'find_link_by_path',
  displayName: 'Find Link by Short URL (AI)',
  description: 'Find a short link from its full short URL, or from a domain plus slug.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Looks up a short link from its public short URL (e.g. https://link.example.com/promo) or from a domain plus slug, returning the link ID and settings. Returns found=false when the slug does not exist. Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.linkLookup,
  props: {
    shortUrl: Property.ShortText({
      displayName: 'Short URL or Slug',
      description: 'Full short URL like https://link.example.com/promo, or just the slug "promo" when Domain is given.',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Domain hostname or ID; needed only when Short URL is a bare slug.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const parsed = shortIoLinks.parseShortUrl(propsValue.shortUrl ?? '');
    if (!parsed.path) {
      throw new Error('Give a short URL with a slug, e.g. https://link.example.com/promo.');
    }
    const domainInput = parsed.hostname ?? propsValue.domain?.trim();
    if (!domainInput) {
      throw new Error('Domain is required when Short URL is only a slug.');
    }
    const domain = await shortIoLinks.resolveDomain({ auth, input: domainInput });
    const link = await shortIoLinkQueries.expand({ auth, hostname: domain.hostname, path: parsed.path });
    return { found: link !== null, link };
  },
});
