import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const socialkitApiUrl = 'https://api.socialkit.dev';

export const socialkitAuth = PieceAuth.SecretText({
  displayName: 'Access Key',
  description: `
    To get your Access Key:
    1. Sign up at SocialKit Dashboard
    2. Copy your Access Key from the project Access Keys tab.
    **Important:** Keep your Access Key confidential.
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${socialkitApiUrl}/youtube/stats?access_key=${auth}&url=https://youtube.com/watch?v=dQw4w9WgXcQ`,
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Access Key.',
      };
    }
  },
});
