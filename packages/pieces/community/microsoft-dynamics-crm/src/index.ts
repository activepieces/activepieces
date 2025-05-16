import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createRecordAction } from './lib/actions/create-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { getRecordAction } from './lib/actions/get-record';
import { updateRecordAction } from './lib/actions/update-record';
import { OAuth2GrantType, PieceCategory } from '@activepieces/shared';

export const dynamicsCRMAuth = PieceAuth.OAuth2({
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
    grantType: Property.StaticDropdown({
      displayName: 'Grant Type',
      description: 'Choose whether to use the client credentials or authorization code flow',
      required: true,
      options: {
        options: [
          { value: OAuth2GrantType.CLIENT_CREDENTIALS.toString(), label: 'Client credentials' },
          { value: OAuth2GrantType.AUTHORIZATION_CODE.toString(), label: 'Authorization code' },
        ],
      },
    })
  },
  required: true,
  scope: ['{hostUrl}/.default', 'openid', 'email', 'profile', 'offline_access'],
  authUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
  grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
});

export function getBaseUrl(host: string, proxyUrl?: string): string {
  if (proxyUrl && proxyUrl !== '') {
    return proxyUrl;
  }
  return host;
}

export const microsoftDynamicsCrm = createPiece({
  displayName: 'Microsoft Dynamics CRM',
  auth: dynamicsCRMAuth,
  description:
    'Customer relationship management software package developed by Microsoft.',
  minimumSupportedRelease: '0.27.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-dynamics-crm.png',
  authors: ['kishanprmr'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    createRecordAction,
    deleteRecordAction,
    getRecordAction,
    updateRecordAction,
    createCustomApiCallAction({
      auth: dynamicsCRMAuth,
      baseUrl: (auth) => {
        const props = (auth as OAuth2PropertyValue).props as {
          hostUrl: string;
          proxyUrl: string;
        };
        return `${getBaseUrl(
          props?.['hostUrl'],
          props.proxyUrl
        )}/api/data/v9.2`;
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer  ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
