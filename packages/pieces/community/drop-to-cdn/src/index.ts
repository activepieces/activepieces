import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { dropToCdnAuth } from './lib/auth';
import { uploadFile } from './lib/actions/upload-file';
import { getFile } from './lib/actions/get-file';
import { deleteFile } from './lib/actions/delete-file';

export const dropToCdn = createPiece({
  displayName: 'Drop to CDN',
  description:
    'Upload files and get instant public CDN URLs on Cloudflare global edge.',
  auth: dropToCdnAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/drop-to-cdn.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['Nexus-JPF'],
  actions: [uploadFile, getFile, deleteFile],
  triggers: [],
});
