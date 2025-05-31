import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createAvatarVideo } from './lib/actions/create-avatar-video';
import { translateAVideo } from './lib/actions/translate-video';
import { uploadAnAsset } from './lib/actions/upload-asset';
import { createAVideoFromTemplate } from './lib/actions/create-video-from-template';
import { videoGenerationCompleted } from './lib/triggers/video-generation-completed';
import { videoGenerationFailed } from './lib/triggers/video-generation-failed';
import { retrieveVideoStatus } from './lib/actions/retrieve-video-status';
import { retrieveShareableVideoLink } from './lib/actions/retrieve-shareable-video-link';
import { retrieveTranslatedVideoStatus } from './lib/actions/retrieve-translated-video-status';

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
    retrieveVideoStatus,
    retrieveShareableVideoLink,
    retrieveTranslatedVideoStatus
  ],
  triggers: [
    videoGenerationCompleted,
    videoGenerationFailed,
  ],
});
