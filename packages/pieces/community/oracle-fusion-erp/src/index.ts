import {
  createCustomApiCallAction,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getEmployeeAction } from './lib/actions/get-employee';
import { createInvoiceAction } from './lib/actions/create-invoice';
import { getPurchaseOrderAction } from './lib/actions/get-purchase-order';

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
      const tokenResponse = await fetch(`${auth.baseUrl}/oauth2/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${auth.clientId}:${auth.clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (tokenResponse.ok) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid credentials or base URL' };
    } catch (e) {
      return { valid: false, error: 'Failed to connect to Oracle Fusion Cloud ERP' };
    }
  },
});

export const oracleFusionErp = createPiece({
  displayName: 'Oracle Fusion Cloud ERP',
  description: 'Integrate with Oracle Fusion Cloud ERP for financial and HR operations',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/oracle.png',
  authors: ['activepieces'],
  categories: [PieceCategory.ACCOUNTING],
  auth: oracleFusionErpAuth,
  actions: [
    getEmployeeAction,
    createInvoiceAction,
    getPurchaseOrderAction,
    createCustomApiCallAction({
      baseUrl: (auth) => `${(auth as { baseUrl: string }).baseUrl}/fscmRestApi/resources/latest`,
      auth: oracleFusionErpAuth,
      authMapping: async (auth) => {
        const a = auth as { baseUrl: string; clientId: string; clientSecret: string };
        const tokenResponse = await fetch(`${a.baseUrl}/oauth2/v1/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${a.clientId}:${a.clientSecret}`).toString('base64')}`,
          },
          body: 'grant_type=client_credentials',
        });
        if (!tokenResponse.ok) {
          throw new Error('Failed to fetch access token from Oracle Fusion Cloud ERP');
        }
        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
          throw new Error('Failed to get access token from OAuth response');
        }
        return { Authorization: `Bearer ${tokenData.access_token}` };
      },
    }),
  ],
  triggers: [],
});
