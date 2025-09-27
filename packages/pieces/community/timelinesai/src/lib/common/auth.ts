import { PieceAuth, StaticPropsValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

const TIMELINESAI_API_URL = 'https://app.timelines.ai/integrations/api';

const timelinesaiAuthProps = {
  api_key: PieceAuth.SecretText({
    displayName: 'API Key',
    description: 'Your TimelinesAI API Key. You can find this in your TimelinesAI dashboard under Settings > API Keys.',
    required: true,
  }),
};

export const timelinesaiAuth = PieceAuth.CustomAuth({
  description: `To get your API credentials:\n1. Log in to your TimelinesAI dashboard at https://app.timelines.ai\n2. Navigate to Settings > API Keys\n3. Generate a new API key\n4. Copy the API key and paste it here`,
  required: true,
  props: timelinesaiAuthProps,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${TIMELINESAI_API_URL}/chats`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.api_key,
        },
        queryParams: {
          limit: '1',
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key. Please check your credentials and try again.',
      };
    }
  },
});

export type TimelinesaiAuth = StaticPropsValue<typeof timelinesaiAuthProps>;
