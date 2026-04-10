import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { getMicrosoftCloudFromAuth, getPowerBiBaseUrl } from './lib/common/microsoft-cloud';
import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createDatasetAction } from './lib/actions/create-dataset';
import { pushRowsToDatasetTableAction } from './lib/actions/push-rows-to-table';
import { microsoftPowerBiAuth } from './lib/auth';

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
      baseUrl: (auth) => {
        const cloud = getMicrosoftCloudFromAuth(auth as OAuth2PropertyValue);
        return getPowerBiBaseUrl(cloud) + '/datasets';
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [],
});
