import { PieceAuth, Property } from '@activepieces/pieces-framework';

const authDesc = `
Follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application),
 set the **Redirect URI** to {{redirectUrl}} and add the **Dynamics CRM (Delegated) permissions** under **API permissions**.`;

export const dynamicsCRMAuth = PieceAuth.OAuth2({
  description: authDesc,
  props: {
    hostUrl: Property.ShortText({
      displayName: 'Host URL (without trailing slash)',
      description:
        'Host URL without trailing slash.For example **https://demo.crm.dynamics.com**',
      required: true,
    }),
    tenantId: Property.ShortText({
      displayName: 'Tenant ID',
      description: 'You can find this in the Azure portal.',
      defaultValue: 'common',
      required: true,
    }),
    proxyUrl: Property.ShortText({
      displayName: 'Proxy URL with Port',
      description:
        'Keep empty if not needed. Optional proxy URL used for establishing connections when proxying requests is needed. For example: **https://proxy.com:8080**.',
      required: false,
    }),
  },
  required: true,
  scope: ['{hostUrl}/.default', 'openid', 'email', 'profile', 'offline_access'],
  prompt: 'omit',
  authUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
});
