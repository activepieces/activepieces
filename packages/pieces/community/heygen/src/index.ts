import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { generateVideoFromTemplateAction } from './lib/actions/create-a-video-from-template';
import { createAvatarVideoAction } from './lib/actions/create-avatar-video';
import { retrieveTranslatedVideoStatus } from './lib/actions/retrieve-a-translated-video-status';
import { retrieveVideoStatusAction } from './lib/actions/retrieve-a-video-status';
import { retrieveSharableVideoUrlAction } from './lib/actions/retrieve-shareable-link-for-a-video';
import { uploadAssetAction } from './lib/actions/upload-an-asset';
import { videoGenerationCompletedTrigger } from './lib/triggers/video-generation-completed';
import { videoGenerationFailedTrigger } from './lib/triggers/video-generation-failed';

export const heygenAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Enter your HeyGen API Key.',
});

export const heygen = createPiece({
  displayName: 'HeyGen',
  description: 'Generate and manage AI avatar videos using HeyGen',
  auth: heygenAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/heygen.png',
  authors: ['krushnarout'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [generateVideoFromTemplateAction, createAvatarVideoAction, retrieveTranslatedVideoStatus, retrieveVideoStatusAction, retrieveSharableVideoUrlAction, uploadAssetAction],
  triggers: [videoGenerationCompletedTrigger, videoGenerationFailedTrigger],
});
