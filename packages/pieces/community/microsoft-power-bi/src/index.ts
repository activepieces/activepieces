import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { pushRowsToDatasetTableAction } from './lib/actions/push-rows-to-table';
import { createDatasetAction } from './lib/actions/create-dataset';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const microsoftPowerBiAuth = PieceAuth.OAuth2({
  description: 'Authentication for Microsoft Power BI',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'https://analysis.windows.net/powerbi/api/Dataset.ReadWrite.All',
    'offline_access',
  ],
});

export const microsoftPowerBi = createPiece({
  displayName: 'Microsoft Power BI',
  description: 'Create and manage Power BI datasets and push data to them',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-power-bi.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: microsoftPowerBiAuth,
  authors: ['calladodan'],
  actions: [
    createDatasetAction,
    pushRowsToDatasetTableAction,
    createCustomApiCallAction({
      auth: microsoftPowerBiAuth,
      baseUrl: () => 'https://api.powerbi.com/v1.0/myorg/datasets',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [],
});
