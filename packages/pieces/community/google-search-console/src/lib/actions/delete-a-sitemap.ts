import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { commonProps } from '../common';
import { gscInputs } from '../common/inputs';
import { gscOps } from '../common/operations';
import { gscOutputSchemas } from '../output-schemas';

export const deleteSitemap = createAction({
  auth: googleSearchConsoleAuth,
  name: 'delete_sitemap',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete a Sitemap',
  description: 'Removes a sitemap from the Sitemaps report of a site.',
  audience: 'human',
  aiMetadata: {
    description:
      'Removes a sitemap picked from a list from the Sitemaps report of a property. Agents use Delete Sitemap (by Site URL). Deleting a sitemap that is already gone also succeeds, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    siteUrl: commonProps.siteUrl,
    feedpath: commonProps.sitemap,
  },
  outputSchema: gscOutputSchemas.sitemapChange,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.siteUrl });
    const feedpath = gscInputs.absoluteUrl({ value: context.propsValue.feedpath, label: 'Sitemap' });
    await gscOps.deleteSitemap({ auth: context.auth, siteUrl, feedpath });
    return { success: true, siteUrl, feedpath };
  },
});
