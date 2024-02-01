import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendMessage } from './lib/actions/send-message';

const markdownDescription = `
**Workspace URL**: The url of mattermost instance (e.g \`https://activepieces.mattermost.com\`)

**Bot Token**: Obtain it from settings > integrations > bot accounts > add bot account
`;

export const mattermostAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    workspace_url: Property.ShortText({
      displayName: 'Workspace URL',
      description:
        'The workspace URL of the Mattermost instance (e.g https://activepieces.mattermost.com)',
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

  logoUrl: 'https://cdn.activepieces.com/pieces/mattermost.png',
  minimumSupportedRelease: '0.5.0',
  authors: ['abuaboud'],
  categories: [PieceCategory.COMMUNICATION],
  auth: mattermostAuth,
  actions: [sendMessage],
  triggers: [],
});
