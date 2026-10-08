import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../../auth';
import { commonProps } from '../../common';
import { gscInputs } from '../../common/inputs';
import { gscOps } from '../../common/operations';
import { gscShape } from '../../common/shape';
import { gscOutputSchemas } from '../../output-schemas';

export const listSitemapsBySiteUrl = createAction({
  auth: googleSearchConsoleAuth,
  name: 'list_sitemaps_by_site_url',
  classification: 'SEARCH',
  displayName: 'List Sitemaps (by Site URL)',
  description: 'Lists the sitemaps submitted for a property.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the sitemaps submitted for a property with their health: errors, warnings, pending state, last download and submitted URL counts. Use Get Sitemap when you already know the sitemap URL; pass sitemap_index to list the children of a sitemap index. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    site_url: commonProps.aiSiteUrl(),
    sitemap_index: Property.ShortText({
      displayName: 'Sitemap Index URL',
      description: 'Optional. The full URL of a sitemap index; only the sitemaps inside it are listed.',
      required: false,
    }),
  },
  outputSchema: gscOutputSchemas.listSitemapsAi,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.site_url });
    const sitemapIndex = context.propsValue.sitemap_index ? gscInputs.absoluteUrl({ value: context.propsValue.sitemap_index, label: 'Sitemap Index URL' }) : undefined;
    const sitemaps = (await gscOps.listSitemaps({ auth: context.auth, siteUrl, sitemapIndex })).map(gscShape.sitemapFlat);
    return { sitemaps, count: sitemaps.length };
  },
});
