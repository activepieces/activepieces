import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { DynamicsApiError, makeClient } from './common/client';
import { microsoftCloudProperty } from './common/microsoft-cloud';

const authDesc = `
1. Follow the [Azure app creation guide](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app#register-an-application) and set the **Redirect URI** to {{redirectUrl}}.
2. Under **API permissions**, add **Dynamics CRM > user_impersonation (Delegated)**.
3. Copy your environment URL from **Power Platform admin center > Environments > (your environment) > Environment URL**. It must start with **https://**, for example **https://yourorg.crm.dynamics.com**, with no trailing slash.`;

export const dynamicsCRMAuth = PieceAuth.OAuth2({
  description: authDesc,
  props: {
    cloud: microsoftCloudProperty,
    hostUrl: Property.ShortText({
      displayName: 'Environment URL (must start with https://)',
      description:
        'The full address of your Dynamics 365 environment, including **https://** and without a trailing slash, for example **https://yourorg.crm.dynamics.com**. Without https:// Microsoft rejects the sign-in with error AADSTS70011.',
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
  authUrl: 'https://{cloud}/{tenantId}/oauth2/v2.0/authorize',
  tokenUrl: 'https://{cloud}/{tenantId}/oauth2/v2.0/token',
  validate: async ({ auth }) => {
    try {
      await makeClient(auth).whoAmI();
      return { valid: true };
    } catch (error) {
      if (error instanceof DynamicsApiError && (error.status === 401 || error.status === 403)) {
        return {
          valid: false,
          error: `Dynamics 365 rejected the connection (HTTP ${error.status}). Check that the Environment URL is your environment's address and that your user has a security role in it.`,
        };
      }
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Dynamics 365 could not validate the connection.',
      };
    }
  },
});
