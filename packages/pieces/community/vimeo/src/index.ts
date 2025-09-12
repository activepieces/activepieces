import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { vimeoAuth } from './lib/common/auth';
import { vimeoUploadFromUrl } from './lib/actions/upload-from-url';
import { vimeoDeleteVideo } from './lib/actions/delete-video';
import { vimeoAddToAlbum } from './lib/actions/add-to-album';

export const vimeo = createPiece({
  displayName: 'Vimeo',
  description: 'Upload and manage videos on Vimeo.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/vimeo.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['Ripasco'],
  auth: vimeoAuth,
  actions: [vimeoUploadFromUrl, vimeoAddToAlbum, vimeoDeleteVideo],
  triggers: [],
});

