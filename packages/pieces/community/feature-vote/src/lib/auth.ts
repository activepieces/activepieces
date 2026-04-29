import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
Follow these steps to obtain your FeaturesVote API Key:

1. Go to your [FeaturesVote](https://features.vote/) project.
2. Navigate to **Settings** → **API Keys**.
3. Click **Create API Key** and copy it — it is only shown once.
4. Requires a **Growth** or **VIP** subscription plan.
`;

export const featuresVoteAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://features.vote/api/releases',
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API Key' };
    }
  },
});