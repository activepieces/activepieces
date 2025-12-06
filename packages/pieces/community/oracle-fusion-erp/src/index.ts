import {
  createCustomApiCallAction,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getEmployeeAction } from './lib/actions/get-employee';
import { createInvoiceAction } from './lib/actions/create-invoice';
import { getPurchaseOrderAction } from './lib/actions/get-purchase-order';
import { getOAuthToken, OracleFusionAuth } from './lib/auth';

export const oracleFusionErpAuth = PieceAuth.CustomAuth({
  description: 'Oracle Fusion Cloud ERP Authentication',
  required: true,
  props: {
    baseUrl: PieceAuth.SecretText({
      displayName: 'Base URL',
      description: 'Your Oracle Fusion Cloud instance URL (e.g., https://your-instance.fa.us2.oraclecloud.com)',
      required: true,
    }),
    clientId: PieceAuth.SecretText({
      displayName: 'Client ID',
      description: 'OAuth2 Client ID from Oracle Cloud',
      required: true,
    }),
    clientSecret: PieceAuth.SecretText({
      displayName: 'Client Secret',
      description: 'OAuth2 Client Secret from Oracle Cloud',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await getOAuthToken(auth as OracleFusionAuth);
      return { valid: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to connect to Oracle Fusion Cloud ERP';
      return { valid: false, error: errorMessage };
    }
  },
});

export const oracleFusionErp = createPiece({
  displayName: 'Oracle Fusion Cloud ERP',
  description: 'Integrate with Oracle Fusion Cloud ERP for financial and HR operations',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/oracle.png',
  authors: ['activepieces'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  auth: oracleFusionErpAuth,
  actions: [
    getEmployeeAction,
    createInvoiceAction,
    getPurchaseOrderAction,
    createCustomApiCallAction({
      baseUrl: (auth) => `${(auth as OracleFusionAuth).baseUrl}/fscmRestApi/resources/latest`,
      auth: oracleFusionErpAuth,
      authMapping: async (auth) => {
        const accessToken = await getOAuthToken(auth as OracleFusionAuth);
        return { Authorization: `Bearer ${accessToken}` };
      },
    }),
  ],
  triggers: [],
});
