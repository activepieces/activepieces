import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { billsbyRequest } from './common/client';

export const billsbyAuth = PieceAuth.CustomAuth({
  description: 'Authenticate with your Billsby account.',
  required: true,
  props: {
    company_domain: Property.ShortText({
      displayName: 'Company Domain',
      description: 'Your Billsby company subdomain (e.g. mycompany).',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Billsby API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await billsbyRequest({
        auth,
        path: '/customers',
        queryParams: { page: '1', pageSize: '1' },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or company domain.',
      };
    }
  },
});

export type BillsbyAuthType = {
  company_domain: string;
  api_key: string;
};
