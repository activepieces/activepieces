import { createAction } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth, createAuthClient } from '../../';
import { commonProps } from '../common';

export const deleteSite = createAction({
  auth: googleSearchConsoleAuth,
  name: 'delete_site',
  displayName: 'Delete a Site',
  description: 'Delete a property from your Google Search Console account',
  props: {
    siteUrl: commonProps.siteUrl,
  },
  async run(context) {
    const siteUrl = context.propsValue.siteUrl;

    if (!siteUrl) {
      throw new Error(
        'You must provide either a Site URL or select one from the list.'
      );
    }

    const webmasters = createAuthClient(context.auth.access_token);
    await webmasters.sites.delete({
      siteUrl: siteUrl,
    });

    return { success: true };
  },
});
