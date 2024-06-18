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
import { PieceCategory } from '@activepieces/shared';

export const dynamicsCRMAuth = PieceAuth.OAuth2({
  props: {
    hostUrl: Property.ShortText({
      displayName: 'Host URL (without trailing slash)',
      description:
        'Host URL without trailing slash.For example **https://demo.crm.dynamics.com**',
      required: true,
    }),
    proxyPort: Property.Number({
      displayName: 'Proxy Port',
      description:
        'Port to use for establishing connections (only needed when proxying requests)',
      required: false,
    }),
    tenantId: Property.ShortText({
      displayName: 'Tenant ID',
      description: 'You can find this in the Azure portal.',
      defaultValue: 'common',
      required: true,
    }),
  },
  required: true,
  scope: [
    '{hostUrl}/.default',
    'openid',
    'email',
    'profile',
    'offline_access',
  ],
  authUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
});

export function getBaseUrl(host: string, port?: number): string {
  let portStr = '';
  if (port) {
    portStr = `:${port}`;
  }
  return `${host}${portStr}`;
}

export const microsoftDynamicsCrm = createPiece({
  displayName: 'Microsoft Dynamics CRM',
  auth: dynamicsCRMAuth,
  description: 'Customer relationship management software package developed by Microsoft.',
  minimumSupportedRelease: '0.27.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-dynamics-crm.png',
  authors: ['kishanprmr'],
  categories: [PieceCategory.PREMIUM, PieceCategory.SALES_AND_CRM],
  actions: [
    createRecordAction,
    deleteRecordAction,
    getRecordAction,
    updateRecordAction,
    createCustomApiCallAction({
      auth: dynamicsCRMAuth,
      baseUrl: (auth) => {
        const props = (auth as OAuth2PropertyValue).props as { hostUrl: string, proxyPort: number };
        return `${getBaseUrl(props?.['hostUrl'], props.proxyPort)}/api/data/v9.2`;
      },
      authMapping: (auth) => ({
        Authorization: `Bearer  ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
