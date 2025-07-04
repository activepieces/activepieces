import { createPiece, OAuth2PropertyValue, PieceAuth } from "@activepieces/pieces-framework";
import { pushRowsToDatasetTable } from './lib/actions/push-rows-to-table';
import { createDataset } from './lib/actions/create-dataset';
import { PieceCategory } from '@activepieces/shared';

export type MicrosoftPowerBiAuthType = {
  type: 'oauth2';
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
};

export const microsoftPowerBiAuth = PieceAuth.OAuth2({
    description: "Authentication for Microsoft Power BI",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    required: true,
    scope: [
      'https://analysis.windows.net/powerbi/api/.default',
      'offline_access'
  ]
});

export const microsoftPowerBi = createPiece({
  displayName: "Microsoft Power BI",
  description: "Create and manage Power BI datasets and push data to them",
  minimumSupportedRelease: '0.5.0',
  logoUrl: "https://raw.githubusercontent.com/microsoft/PowerBI-Icons/main/SVG/Power-BI.svg",
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: microsoftPowerBiAuth,
  authors: ['calladodan'],
  actions: [pushRowsToDatasetTable, createDataset],
  triggers: [],
});
    