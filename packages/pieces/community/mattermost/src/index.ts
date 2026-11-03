import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { mattermostAiActions } from './lib/actions/ai';
import { sendMessageAction } from './lib/actions/send-message';
import { mattermostAuth } from './lib/auth';
import { mattermostClient } from './lib/common/client';

export const mattermost = createPiece({
  displayName: 'Mattermost',
  description: 'Open-source, self-hosted Slack alternative',
  logoUrl: 'https://cdn.activepieces.com/pieces/mattermost.png',
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  auth: mattermostAuth,
  actions: [
    sendMessageAction,
    ...mattermostAiActions,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? mattermostClient.baseUrl({ auth }) : ''),
      auth: mattermostAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.token}`,
      }),
    }),
  ],
  triggers: [],
});
