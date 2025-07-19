import { createCustomApiCallAction } from '@ensemble/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import { sendMessage } from './lib/actions/send-message';

const markdownDescription = `
**Workspace URL**: The url of mattermost instance (e.g \`https://ensemble.mattermost.com\`)

**Bot Token**: Obtain it from settings > integrations > bot accounts > add bot account
`;

export const mattermostAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    workspace_url: Property.ShortText({
      displayName: 'Workspace URL',
      description:
        'The workspace URL of the Mattermost instance (e.g https://ensemble.mattermost.com)',
      required: true,
    }),
    token: Property.ShortText({
      displayName: 'Bot Token',
      description: 'The bot token to use to authenticate',
      required: true,
    }),
  },
});

export const mattermost = createPiece({
  displayName: 'Mattermost',
  description: 'Open-source, self-hosted Slack alternative',

  logoUrl: 'https://cdn.ensemble.com/pieces/mattermost.png',
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.COMMUNICATION],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: mattermostAuth,
  actions: [
    sendMessage,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        (auth as { workspace_url: string }).workspace_url + '/api/v4',
      auth: mattermostAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { token: string }).token}`,
      }),
    }),
  ],
  triggers: [],
});
