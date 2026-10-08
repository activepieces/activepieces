import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { commonProps } from '../common';
import { gscInputs } from '../common/inputs';
import { gscOps } from '../common/operations';
import { gscOutputSchemas } from '../output-schemas';

export const submitSitemap = createAction({
  auth: googleSearchConsoleAuth,
  name: 'submit_sitemap',
  classification: 'WRITE',
  displayName: 'Submit a Sitemap',
  description: 'Submits a sitemap for a site.',
  audience: 'human',
  aiMetadata: {
    description:
      'Submits or resubmits a sitemap URL for a property picked from a list. Agents use Submit Sitemap (by Site URL). Resubmitting the same URL only refreshes it, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    siteUrl: commonProps.siteUrl,
    feedpath: Property.ShortText({
      displayName: 'Sitemap Path',
      description: 'The full URL of the sitemap, e.g. "https://www.example.com/sitemap.xml".',
      required: true,
    }),
  },
  outputSchema: gscOutputSchemas.sitemapChange,
  async run(context) {
    const siteUrl = gscInputs.siteUrl({ value: context.propsValue.siteUrl });
    const feedpath = gscInputs.absoluteUrl({ value: context.propsValue.feedpath, label: 'Sitemap Path' });
    await gscOps.submitSitemap({ auth: context.auth, siteUrl, feedpath });
    return { success: true, siteUrl, feedpath };
  },
});
