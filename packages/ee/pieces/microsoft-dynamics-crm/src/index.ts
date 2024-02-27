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

export const dynamicsCRMAuth = PieceAuth.OAuth2({
  props: {
    hostUrl: Property.ShortText({
      displayName: 'Host URL (without trailing slash)',
      description:
        'Host URL without trailing slash.For example **https://demo.crm.dynamics.com**',
      required: true,
    }),
    tenatId: Property.ShortText({
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
  authUrl: 'https://login.microsoftonline.com/{tenatId}/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/{tenatId}/oauth2/v2.0/token',
});

export const microsoftDynamicsCrm = createPiece({
  displayName: 'Microsoft Dynamics CRM',
  auth: dynamicsCRMAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-dynamics-crm.png',
  authors: ['kishanprmr'],
  actions: [
    createRecordAction,
    deleteRecordAction,
    getRecordAction,
    updateRecordAction,
    createCustomApiCallAction({
      auth: dynamicsCRMAuth,
      baseUrl: (auth) => {
        return `${
          (auth as OAuth2PropertyValue).props?.['hostUrl']
        }/api/data/v9.2`;
      },
      authMapping: (auth) => ({
        Authorization: `Bearer  ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
