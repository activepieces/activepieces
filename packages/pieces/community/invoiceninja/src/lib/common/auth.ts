import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { InvoiceNinjaApiError, invoiceNinjaClient } from './client';

export const invoiceninjaAuth = PieceAuth.CustomAuth({
  description: `
    To connect Invoice Ninja (v5):

    1. Log in to Invoice Ninja (https://invoicing.co or your self-hosted server).
    2. Open **Settings > Account Management > API Tokens** and create a token.
    3. Paste the token below. Base URL is https://invoicing.co for the hosted service, or the address of your own server (for example https://invoices.example.com).
    `,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description: 'https://invoicing.co for the hosted service, or your self-hosted address such as https://invoices.example.com',
      required: true,
    }),
    access_token: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Settings > Account Management > API Tokens in Invoice Ninja.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      invoiceNinjaClient.normalizeBaseUrl(auth.base_url);
      invoiceNinjaClient.tokenOf(auth);
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Invalid connection.' };
    }
    try {
      const body = await invoiceNinjaClient.request({ auth, method: HttpMethod.GET, path: '/ping' });
      if (!invoiceNinjaClient.isRecord(body) || typeof body['company_name'] !== 'string') {
        return { valid: false, error: 'The Base URL does not point to an Invoice Ninja v5 server.' };
      }
      return { valid: true };
    } catch (error) {
      if (error instanceof InvoiceNinjaApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid API Token.' };
      }
      return {
        valid: false,
        error: error instanceof Error ? `Could not reach Invoice Ninja: ${error.message}` : 'Could not reach Invoice Ninja.',
      };
    }
  },
  required: true,
});
