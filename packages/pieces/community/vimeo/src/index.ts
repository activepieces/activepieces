import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { vimeoAuth } from './lib/common/auth';

// Import triggers
import { newLikedVideoTrigger } from './lib/triggers/new-liked-video';
import { newVideoBySearchTrigger } from './lib/triggers/new-video-by-search';
import { newVideoOfMineTrigger } from './lib/triggers/new-video-of-mine';
import { newVideoByUserTrigger } from './lib/triggers/new-video-by-user';

// Import actions
import { uploadVideoAction } from './lib/actions/upload-video';
import { addVideoToAlbumAction } from './lib/actions/add-video-to-album';
import { deleteVideoAction } from './lib/actions/delete-video';

export const vimeo = createPiece({
  displayName: 'Vimeo',
  description: 'Video hosting and distribution platform with powerful privacy, collaboration, and embedding controls',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/vimeo.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: vimeoAuth,
  authors: ['activepieces'],
  actions: [
    uploadVideoAction,
    addVideoToAlbumAction,
    deleteVideoAction,
  ],
  triggers: [
    newLikedVideoTrigger,
    newVideoBySearchTrigger,
    newVideoOfMineTrigger,
    newVideoByUserTrigger,
  ],
});
