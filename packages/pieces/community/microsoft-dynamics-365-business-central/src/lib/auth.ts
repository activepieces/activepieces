import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { microsoftCloudProperty } from './common/microsoft-cloud';

const authDesc = `
If you’d like to use your own custom Azure app instead of the default Activepieces app, follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the following **Dynamics 365 Business Central permissions** under **API permissions**:
 - Financials.ReadWrite.All
 - user_impersonation
`;

export const businessCentralAuth = PieceAuth.OAuth2({
  description: authDesc,
  props: {
    cloud: microsoftCloudProperty,
    environment: Property.ShortText({
      displayName: 'Environment',
      description: `Name of the environment to connect to, e.g. 'Production' or 'Sandbox'. Environment names can be found in the Business Central Admin Center.`,
      required: true,
      defaultValue: 'Production',
    }),
  },
  required: true,
  scope: [
    'https://api.businesscentral.dynamics.com/user_impersonation',
    'https://api.businesscentral.dynamics.com/Financials.ReadWrite.All',
  ],
  prompt: 'omit',
  authUrl: 'https://{cloud}/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://{cloud}/common/oauth2/v2.0/token',
});
