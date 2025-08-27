import {
  OAuth2PropertyValue,
  createPiece,
} from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { vimeoAuth } from './lib/common/auth';
import { uploadVideo } from './lib/actions/upload-video';
import { deleteVideo } from './lib/actions/delete-video';
import { addVideoToShowcase } from './lib/actions/add-video-to-showcase';
import { newVideoLiked } from './lib/triggers/new-video-liked';
import { newVideoByUser } from './lib/triggers/new-video-by-user';
import { newVideoOfMine } from '././lib/triggers/new-video-of-mine';
import { newVideoBySearch } from './lib/triggers/new-video-by-search';

export const vimeo = createPiece({
  displayName: 'Vimeo',
  logoUrl: 'https://cdn.activepieces.com/pieces/vimeo.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['devroy10'],
  auth: vimeoAuth,
  minimumSupportedRelease: '0.36.1',
  actions: [
    uploadVideo,
    addVideoToShowcase,
    deleteVideo,
    createCustomApiCallAction({
      auth: vimeoAuth,
      baseUrl: () => 'https://api.vimeo.com',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newVideoLiked, newVideoBySearch, newVideoOfMine, newVideoByUser],
});

export default vimeo;
