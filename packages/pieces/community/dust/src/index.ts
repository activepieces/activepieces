import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createConversation } from './lib/actions/create-conversation';

export const dustAuth = PieceAuth.CustomAuth({
  description: 'Dust authentication requires an API key.',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API key',
      required: true,
    }),
    workspaceId: Property.ShortText({
      displayName: 'Dust workspace ID',
      required: true,
      description: "Can be found in any of the workspace's URL",
    }),
  },
});

export type DustAuthType = {
  apiKey: string;
  workspaceId: string;
};

export const dust = createPiece({
  displayName: 'Dust',
  auth: dustAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dust.png',
  authors: ['AdamSelene'],
  actions: [createConversation],
  triggers: [],
});
