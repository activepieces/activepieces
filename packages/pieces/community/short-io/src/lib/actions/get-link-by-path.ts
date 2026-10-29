import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoLinkQueries } from '../common/link-queries';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { domainIdDropdown } from '../common/props';

export const getLinkByPathAction = createAction({
  auth: shortIoAuth,
  name: 'get-short-link-info-by-path',
  classification: 'READ',
  displayName: 'Get Link by Path',
  description: 'Retrieve detailed information about a short link using its domain and path.',
  audience: 'human',
  aiMetadata: {
    description:
      'Looks up one short link and its details by domain plus path/slug (rather than by link ID). Requires a domain and the bare slug. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.legacyLink,
  props: {
    domain: domainIdDropdown,
    path: Property.ShortText({
      displayName: 'Link Path',
      description: 'The path/slug of the short link (e.g., "abc123", "my-link"). Do not include domain or slashes.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const domain = shortIoLinks.parseDomainProp(propsValue.domain);
    const cleanPath = (propsValue.path ?? '').trim();
    if (!cleanPath) {
      throw new Error('Path is required and cannot be empty.');
    }
    if (cleanPath.includes('/') || /^https?:/i.test(cleanPath)) {
      throw new Error('Path should only contain the slug (e.g., "abc123"), not the full URL or domain.');
    }
    const link = await shortIoLinkQueries.expand({ auth, hostname: domain.hostname, path: cleanPath });
    if (!link) {
      throw new Error(`Short link with path "${cleanPath}" not found on domain "${domain.hostname}".`);
    }
    return {
      success: true,
      message: `Link information for "${cleanPath}" retrieved successfully`,
      data: link,
    };
  },
});
