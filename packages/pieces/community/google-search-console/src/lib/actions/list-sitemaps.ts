import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';
import { commonProps } from '../common';

export const listSitemaps = createAction({
  auth: googleSearchConsoleAuth,
  name: 'list_sitemaps',
  displayName: 'List Sitemaps',
  description: 'List all your sitemaps for a given site',
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
