import { createAction, Property } from '@activepieces/pieces-framework';
import { privatusAnalyticsAuth } from '../auth';
import { listSites } from '../common/client';

export const listSitesAction = createAction({
  auth: privatusAnalyticsAuth,
  name: 'list_sites',
  classification: 'SEARCH',
  displayName: 'List Sites',
  description: 'Lists the websites in your Privatus Analytics workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every website in the connected Privatus Analytics workspace with its site ID, domain, name and timezone. Use it first to find the site ID that the stats actions need. Read-only; safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search',
      description: 'Only sites whose domain or name contains this text. Leave empty for all sites.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const sites = await listSites(auth.secret_text, propsValue.query ?? undefined);
    return sites.map((site) => ({
      site_id: site.id,
      domain: site.domain,
      name: site.name,
      timezone: site.timezone,
      currency: site.currency ?? null,
      favorite: site.favorite ?? false,
      created_at: site.created_at ?? null,
    }));
  },
});
