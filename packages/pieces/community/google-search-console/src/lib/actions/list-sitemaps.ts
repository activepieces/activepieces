import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { commonProps } from '../common';
import { gscInputs } from '../common/inputs';
import { gscOps } from '../common/operations';
import { gscOutputSchemas } from '../output-schemas';

export const listSitemaps = createAction({
  auth: googleSearchConsoleAuth,
  name: 'list_sitemaps',
  classification: 'SEARCH',
  displayName: 'List Sitemaps',
  description: 'Lists the sitemaps submitted for a site.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists the sitemaps submitted for a property picked from a list, with their processing status. Agents use List Sitemaps (by Site URL). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    siteUrl: commonProps.siteUrl,
    sitemapIndex: Property.ShortText({
      displayName: 'Sitemap Index URL',
      description: 'Lists only the sitemaps inside this sitemap index. Empty: all.',
      placeholder: 'https://www.example.com/sitemap_index.xml',
      required: false,
    }),
  },
  propertyGroups: [
    {
      key: 'sitemaps',
      display: 'section',
      label: 'Sitemaps',
      icon: 'file',
      props: ['siteUrl', 'sitemapIndex'],
    },
  ],
  outputSchema: gscOutputSchemas.listSitemaps,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.siteUrl });
    const sitemapIndex = context.propsValue.sitemapIndex ? gscInputs.absoluteUrl({ value: context.propsValue.sitemapIndex, label: 'Sitemap Index URL' }) : undefined;
    const sitemap = await gscOps.listSitemaps({ auth: context.auth, siteUrl, sitemapIndex });
    return { sitemap, count: sitemap.length };
  },
});
