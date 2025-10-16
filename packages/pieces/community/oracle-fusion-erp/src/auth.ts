import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const oracleFusionAuth = PieceAuth.CustomAuth({
  required: true,
  description:
    'Provide your Oracle Fusion ERP base URL and credentials. Example base URL: https://yourdomain.fa.oraclecloud.com',
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'e.g. https://yourdomain.fa.oraclecloud.com',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const res = await fetch(`${auth.baseUrl}/fscmRestApi/resources/11.13.18.05/lookupTypes?limit=1`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        return { valid: false, error: `HTTP ${res.status}` };
      }
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e instanceof Error ? e.message : 'Invalid credentials' };
    }
  },
});

export type OracleFusionAuth = {
  baseUrl: string;
  username: string;
  password: string;
};
