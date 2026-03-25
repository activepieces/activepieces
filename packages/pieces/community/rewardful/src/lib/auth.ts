import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const REWARDFUL_BASE_URL = 'https://api.getrewardful.com/v1';

export function rewardfulBasicToken(apiSecret: string): string {
  return Buffer.from(`${apiSecret}:`).toString('base64');
}

export const rewardfulAuth = PieceAuth.CustomAuth({
  displayName: 'Rewardful',
  required: true,
  description:
    'Use your Rewardful API secret key. Rewardful authenticates with HTTP Basic auth using the API secret as the username and an empty password.',
  props: {
    apiSecret: PieceAuth.SecretText({
      displayName: 'API Secret',
      description: 'Your Rewardful API secret key.',
      required: true,
    }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: 'Default Expand Fields',
      description:
        'Optional related objects to expand on supported Rewardful list endpoints.',
      required: false,
      options: {
        options: [
          { label: 'Campaign', value: 'campaign' },
          { label: 'Links', value: 'links' },
          { label: 'Commission Stats', value: 'commission_stats' },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${REWARDFUL_BASE_URL}/campaigns`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.apiSecret,
          password: '',
        },
        queryParams: {
          limit: '1',
        },
      });
      return { valid: true };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401 || err.response?.status === 403) {
        return { valid: false, error: 'Invalid Rewardful API secret.' };
      }
      return {
        valid: false,
        error: 'Could not reach the Rewardful API. Check your API secret and network.',
      };
    }
  },
});

export type RewardfulAuth = {
  apiSecret: string;
  expand?: string[];
};
