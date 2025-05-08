import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createConversation } from './lib/actions/create-conversation';
import { replyToConversation } from './lib/actions/reply-to-conversation';
import { upsertDocument } from './lib/actions/upsert-document';
import { addFragmentToConversation } from './lib/actions/add-fragment-to-conversation';
import { getConversation } from './lib/actions/get-conversation';
import { uploadFile } from './lib/actions/upload-file';

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
    region: Property.StaticDropdown({
      displayName: 'Region',
      required: false,
      defaultValue: 'us',
      options: {
        options: [
          { label: 'US', value: 'us' },
          { label: 'EU', value: 'eu' },
        ],
      },
    }),
  },
});

export type DustAuthType = {
  apiKey: string;
  workspaceId: string;
  region?: 'us' | 'eu';
};

export const dust = createPiece({
  displayName: 'Dust',
  description: 'Secure messaging and collaboration',
  auth: dustAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dust.png',
  authors: ['AdamSelene', 'abuaboud'],
  actions: [
    createConversation,
    getConversation,
    replyToConversation,
    addFragmentToConversation,
    upsertDocument,
    uploadFile,
  ],
  triggers: [],
});
