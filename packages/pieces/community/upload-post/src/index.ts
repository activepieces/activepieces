import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { uploadPostAuth } from './lib/auth';
import { UPLOAD_POST_API_URL } from './lib/common/client';
import { uploadVideo } from './lib/actions/upload-video';
import { uploadPhotos } from './lib/actions/upload-photos';
import { uploadText } from './lib/actions/upload-text';
import { getUploadStatus } from './lib/actions/get-upload-status';
import { listProfiles } from './lib/actions/list-profiles';
import { getUploadHistory } from './lib/actions/get-upload-history';

export const uploadPost = createPiece({
  displayName: 'Upload-Post',
  description:
    'Publish and schedule videos, photos and text posts to TikTok, Instagram, YouTube, LinkedIn, Facebook, X, Threads, Pinterest, Bluesky and more with one API.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/upload-post.png',
  categories: [PieceCategory.MARKETING],
  auth: uploadPostAuth,
  authors: ['mutonby'],
  actions: [
    uploadVideo,
    uploadPhotos,
    uploadText,
    getUploadStatus,
    listProfiles,
    getUploadHistory,
    createCustomApiCallAction({
      baseUrl: () => UPLOAD_POST_API_URL,
      auth: uploadPostAuth,
      authMapping: async (auth) => ({
        Authorization: `Apikey ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
