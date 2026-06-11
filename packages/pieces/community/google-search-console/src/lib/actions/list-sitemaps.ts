import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { createAuthClient } from '../../';
import { commonProps } from '../common';

export const listSitemaps = createAction({
  auth: googleSearchConsoleAuth,
  name: 'list_sitemaps',
  displayName: 'List Sitemaps',
  description: 'List all your sitemaps for a given site',
  audience: 'both',
  aiMetadata: { description: 'List the sitemaps submitted to Google Search Console for a verified site, including their last-download and processing status. Choose this to audit which sitemaps exist before submitting or to check sitemap health. Requires a verified siteUrl; read-only and idempotent.', idempotent: true },
  props: {
    siteUrl: commonProps.siteUrl,
  },
  async run(context) {
    const webmasters = createAuthClient(context.auth.access_token);
    const res = await webmasters.sitemaps.list({
      siteUrl: context.propsValue.siteUrl,
    });
    return res.data;
  },
});
