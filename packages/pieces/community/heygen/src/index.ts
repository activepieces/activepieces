import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createAvatarVideo } from './lib/actions/create-avatar-video';
import { translateAVideo } from './lib/actions/translate-video';
import { uploadAnAsset } from './lib/actions/upload-asset';
import {createAVideoFromTemplate} from './lib/actions/create-video-from-template'
export const heygenAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your API key',
  required: true,
});

export const heygen = createPiece({
  displayName: 'Heygen',
  auth: heygenAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/heygen.png',
  authors: ['Sanket6652'],
  actions: [
    createAvatarVideo,
    translateAVideo,
    uploadAnAsset,
    createAVideoFromTemplate,
  ],
  triggers: [],
});
