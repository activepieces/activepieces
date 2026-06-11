import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { createAuthClient } from '../../';
import { commonProps } from '../common';

export const submitSitemap = createAction({
  auth: googleSearchConsoleAuth,
  name: 'submit_sitemap',
  displayName: 'Submit a Sitemap',
  description: 'Submits a sitemap for a site.',
  audience: 'both',
  aiMetadata: { description: 'Submit a sitemap to Google Search Console for a verified site so Google can discover and crawl its URLs. Choose this when registering a new or updated sitemap. Requires a verified siteUrl and the full sitemap feedpath (URL). Not idempotent: each call re-submits and re-queues the sitemap for processing.', idempotent: false },
  props: {
    siteUrl: commonProps.siteUrl,
    feedpath: Property.ShortText({
      displayName: 'Sitemap Path',
      required: true,
    }),
  },
  async run(context) {
    const webmasters = createAuthClient(context.auth.access_token);
    await webmasters.sitemaps.submit({
      siteUrl: context.propsValue.siteUrl,
      feedpath: context.propsValue.feedpath,
    });
    return { success: true };
  },
});
