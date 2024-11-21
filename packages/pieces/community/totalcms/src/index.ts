import { createPiece } from '@activepieces/pieces-framework';
import { cmsAuth } from './lib/auth';

import { getBlogPostAction } from './lib/actions/get-blog-post';
import { getContentAction } from './lib/actions/get-content';
import { saveBlogGalleryAction } from './lib/actions/save-blog-gallery';
import { saveBlogImageAction } from './lib/actions/save-blog-image';
import { saveBlogPostAction } from './lib/actions/save-blog-post';
import { saveDateAction } from './lib/actions/save-date';
import { saveDepotAction } from './lib/actions/save-depot';
import { saveFileAction } from './lib/actions/save-file';
import { saveGalleryAction } from './lib/actions/save-gallery';
import { saveImageAction } from './lib/actions/save-image';
import { saveTextAction } from './lib/actions/save-text';
import { saveToggleAction } from './lib/actions/save-toggle';
import { saveVideoAction } from './lib/actions/save-video';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { newBlogPost } from './lib/triggers/new-blog-post';

export const totalcms = createPiece({
  displayName: 'Total CMS',
  description: 'Content management system for modern websites',
  auth: cmsAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/totalcms.png',
  categories: [PieceCategory.MARKETING],
  authors: ["joeworkman","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    getContentAction,
    getBlogPostAction,
    saveBlogPostAction,
    saveBlogGalleryAction,
    saveBlogImageAction,
    saveDateAction,
    saveDepotAction,
    saveFileAction,
    saveGalleryAction,
    saveImageAction,
    saveTextAction,
    saveToggleAction,
    saveVideoAction,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { domain: string }).domain,
      auth: cmsAuth,
      authMapping: async (auth) => ({
        'total-key': (auth as { license: string }).license,
      }),
    }),
  ],
  triggers: [newBlogPost],
});
