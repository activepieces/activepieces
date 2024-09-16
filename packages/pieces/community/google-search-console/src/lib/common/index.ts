import { createAuthClient, googleSearchConsoleAuth } from '../../';
import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';

export const commonProps = {
  siteUrl: Property.Dropdown({
    displayName: 'Site URL',
    required: true,
    refreshers: [],
    refreshOnSearch: false,
    options: async ({ auth }) => {
      const authValue = auth as PiecePropValueSchema<
        typeof googleSearchConsoleAuth
      >;
      const webmasters = createAuthClient(authValue.access_token);
      const res = await webmasters.sites.list();
      const sites = res.data.siteEntry || [];

      return {
        options: sites.map((site: any) => ({
          label: site.siteUrl,
          value: site.siteUrl,
        })),
      };
    },
  }),
};
