import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { facebookPagesAuth } from './lib/auth';
import { createPhotoPost } from './lib/actions/create-photo-post';
import { createPost } from './lib/actions/create-post';
import { createVideoPost } from './lib/actions/create-video-post';
import { listManagedPagesAction } from './lib/actions/ai/list-managed-pages';
import { getPageDetailsAction } from './lib/actions/ai/get-page-details';
import { createPagePostAction } from './lib/actions/ai/create-page-post';
import { createPagePhotoPostAction } from './lib/actions/ai/create-page-photo-post';
import { createPageVideoPostAction } from './lib/actions/ai/create-page-video-post';
import { createMultiPhotoPostAction } from './lib/actions/ai/create-multi-photo-post';
import { getPagePostsAction } from './lib/actions/ai/get-page-posts';
import { getPostAction } from './lib/actions/ai/get-post';
import { updatePostAction } from './lib/actions/ai/update-post';
import { deletePostAction } from './lib/actions/ai/delete-post';
import { getScheduledPostsAction } from './lib/actions/ai/get-scheduled-posts';
import { publishScheduledPostAction } from './lib/actions/ai/publish-scheduled-post';
import { reschedulePostAction } from './lib/actions/ai/reschedule-post';
import { getPagePhotosAction } from './lib/actions/ai/get-page-photos';
import { getPageVideosAction } from './lib/actions/ai/get-page-videos';
import { getPostReactionsAction } from './lib/actions/ai/get-post-reactions';

export const facebookPages = createPiece({
  displayName: 'Facebook Pages',
  description: 'Manage your Facebook pages to grow your business',
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/facebook.png',
  categories: [PieceCategory.MARKETING],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: facebookPagesAuth,
  actions: [
    createPost,
    createPhotoPost,
    createVideoPost,
    listManagedPagesAction,
    getPageDetailsAction,
    createPagePostAction,
    createPagePhotoPostAction,
    createPageVideoPostAction,
    createMultiPhotoPostAction,
    getPagePostsAction,
    getPostAction,
    updatePostAction,
    deletePostAction,
    getScheduledPostsAction,
    publishScheduledPostAction,
    reschedulePostAction,
    getPagePhotosAction,
    getPageVideosAction,
    getPostReactionsAction,
  ],
  triggers: [],
});

export { facebookPagesAuth };
