import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../../auth';
import { commonProps } from '../../common';
import { gscInputs } from '../../common/inputs';
import { gscOps } from '../../common/operations';
import { gscOutputSchemas } from '../../output-schemas';

export const submitSitemapBySiteUrl = createAction({
  auth: googleSearchConsoleAuth,
  name: 'submit_sitemap_by_site_url',
  classification: 'WRITE',
  displayName: 'Submit Sitemap (by Site URL)',
  description: 'Submits a sitemap for a property.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Submits a sitemap URL to a property so Google can find its pages, or resubmits it after the sitemap changed. Needs siteOwner or siteFullUser permission. Resubmitting the same URL only refreshes it, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    site_url: commonProps.aiSiteUrl(),
    feedpath: commonProps.feedpathText(),
  },
  outputSchema: gscOutputSchemas.sitemapChangeAi,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.site_url });
    const feedpath = gscInputs.absoluteUrl({ value: context.propsValue.feedpath, label: 'Sitemap URL' });
    await gscOps.submitSitemap({ auth: context.auth, siteUrl, feedpath });
    return { success: true, site_url: siteUrl, feedpath };
  },
});
