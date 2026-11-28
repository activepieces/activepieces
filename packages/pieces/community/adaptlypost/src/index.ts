import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { checkPostAction } from './lib/actions/check-post';
import { createPostAction } from './lib/actions/create-post';
import { deletePostAction } from './lib/actions/delete-post';
import { findLinkedInCompanyPageAction } from './lib/actions/find-linkedin-company-page';
import { findPostsAction } from './lib/actions/find-posts';
import { getPostAction } from './lib/actions/get-post';
import { listSocialAccountsAction } from './lib/actions/list-social-accounts';
import { publishDraftAction } from './lib/actions/publish-draft';
import { retryFailedPlatformsAction } from './lib/actions/retry-failed-platforms';
import { unschedulePostAction } from './lib/actions/unschedule-post';
import { uploadFileAction } from './lib/actions/upload-file';
import { adaptlyPostAuth } from './lib/auth';
import { ADAPTLYPOST_API_URL } from './lib/common/client';
import { accountDisconnectedTrigger } from './lib/triggers/account-disconnected';
import { postFailedTrigger } from './lib/triggers/post-failed';
import { postPublishedTrigger } from './lib/triggers/post-published';
import { postScheduledTrigger } from './lib/triggers/post-scheduled';

export const adaptlypost = createPiece({
  displayName: 'AdaptlyPost',
  description:
    'Schedule and publish social media posts to Instagram, TikTok, LinkedIn, X, Facebook and 9 more platforms.',
  auth: adaptlyPostAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/adaptlypost.png',
  categories: [PieceCategory.MARKETING],
  authors: ['TarasShyn'],
  actions: [
    createPostAction,
    checkPostAction,
    uploadFileAction,
    getPostAction,
    findPostsAction,
    publishDraftAction,
    unschedulePostAction,
    retryFailedPlatformsAction,
    deletePostAction,
    listSocialAccountsAction,
    findLinkedInCompanyPageAction,
    createCustomApiCallAction({
      auth: adaptlyPostAuth,
      baseUrl: () => ADAPTLYPOST_API_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    postPublishedTrigger,
    postFailedTrigger,
    postScheduledTrigger,
    accountDisconnectedTrigger,
  ],
});
