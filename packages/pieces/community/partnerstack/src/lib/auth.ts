import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const PARTNERSTACK_BASE_URL = 'https://api.partnerstack.com/api';

export const partnerstackAuth = PieceAuth.CustomAuth({
  displayName: 'PartnerStack',
  required: true,
  description:
    'Use the public and private API keys from PartnerStack. Authentication uses HTTP Basic auth with public key as username and private key as password.',
  props: {
    publicKey: Property.ShortText({
      displayName: 'Public Key',
      required: true,
    }),
    privateKey: PieceAuth.SecretText({
      displayName: 'Private Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${PARTNERSTACK_BASE_URL}/v2/partnerships`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.publicKey,
          password: auth.privateKey,
        },
        queryParams: {
          limit: '1',
        },
      });
      return { valid: true };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401 || err.response?.status === 403) {
        return { valid: false, error: 'Invalid PartnerStack public/private API key pair.' };
      }
      return {
        valid: false,
        error: 'Could not reach the PartnerStack API. Check your credentials and network.',
      };
    }
  },
});

export type PartnerStackAuth = {
  publicKey: string;
  privateKey: string;
};
