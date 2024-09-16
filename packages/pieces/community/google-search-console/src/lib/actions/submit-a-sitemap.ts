import { createAction, Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';
import { commonProps } from '../common';

export const submitSitemap = createAction({
  auth: googleSearchConsoleAuth,
  name: 'submit_sitemap',
  displayName: 'Submit a Sitemap',
  description: 'Submits a sitemap for a site.',
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
