import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../../auth';
import { commonProps } from '../../common';
import { gscInputs } from '../../common/inputs';
import { gscOps } from '../../common/operations';
import { gscOutputSchemas } from '../../output-schemas';

export const deleteSitemapBySiteUrl = createAction({
  auth: googleSearchConsoleAuth,
  name: 'delete_sitemap_by_site_url',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Sitemap (by Site URL)',
  description: 'Removes a sitemap from the Sitemaps report of a property.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a submitted sitemap from the Sitemaps report of a property. Google may keep crawling the sitemap and its URLs; resubmitting restores the entry. Needs siteOwner or siteFullUser permission; confirm with the user first. Deleting a sitemap that is already gone also succeeds, so it is safe to retry.',
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
    await gscOps.deleteSitemap({ auth: context.auth, siteUrl, feedpath });
    return { success: true, site_url: siteUrl, feedpath };
  },
});
