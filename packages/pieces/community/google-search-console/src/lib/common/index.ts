import { createAuthClient, googleSearchConsoleAuth } from '../../';
import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';

export const commonProps = {
  siteUrl: Property.Dropdown({
    auth: googleSearchConsoleAuth,
    displayName: 'Site URL',
    required: true,
    refreshers: [],
    refreshOnSearch: false,
    options: async ({ auth }) => {
      const authValue = auth
      if (!authValue) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }
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
