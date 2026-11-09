import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { pushMessage } from './lib/actions/push-message';
import { newMessage } from './lib/trigger/new-message';

const lineApiBaseUrl = 'https://api.line.me/v2';

export const lineAuth2 = PieceAuth.SecretText({
  displayName: 'Channel Access Token',
  description: `
To get your channel access token:
1. Open the [LINE Developers Console](https://developers.line.biz/console/) and pick your Messaging API channel.
2. Go to the **Messaging API** tab.
3. Under **Channel access token (long-lived)**, click **Issue** and copy the token.
`,
  required: true,
});

export const line = createPiece({
  displayName: 'Line Bot',
  description: 'Build chatbots for LINE',

  auth: lineAuth2,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/line.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    pushMessage,
    createCustomApiCallAction({
      baseUrl: () => lineApiBaseUrl,
      auth: lineAuth2,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
      props: {
        url: {
          description: `Full URL, or a path relative to ${lineApiBaseUrl}`,
          placeholder: '/bot/info',
        },
      },
    }),
  ],
  triggers: [newMessage],
});
