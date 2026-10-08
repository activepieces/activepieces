import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../../auth';
import { commonProps } from '../../common';
import { gscInputs } from '../../common/inputs';
import { gscOps } from '../../common/operations';
import { gscShape } from '../../common/shape';
import { gscOutputSchemas } from '../../output-schemas';

export const getSitemap = createAction({
  auth: googleSearchConsoleAuth,
  name: 'get_sitemap',
  classification: 'READ',
  displayName: 'Get Sitemap',
  description: 'Gets the status of one submitted sitemap.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the health of one submitted sitemap by its URL: errors, warnings, pending state, last submitted and downloaded times, and submitted URL counts. Use List Sitemaps (by Site URL) when the sitemap URL is unknown. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    site_url: commonProps.aiSiteUrl(),
    feedpath: commonProps.feedpathText(),
  },
  outputSchema: gscOutputSchemas.getSitemap,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.site_url });
    const feedpath = gscInputs.absoluteUrl({ value: context.propsValue.feedpath, label: 'Sitemap URL' });
    return gscShape.sitemapFlat(await gscOps.getSitemap({ auth: context.auth, siteUrl, feedpath }));
  },
});
