import { createPiece } from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { ghostAuth } from './lib/auth';
import { createMember } from './lib/actions/create-member';
import { createPost } from './lib/actions/create-post';
import { findMember } from './lib/actions/find-member';
import { findUser } from './lib/actions/find-user';
import { updateMember } from './lib/actions/update-member';
import { ghostListPosts } from './lib/actions/ai/list-posts';
import { ghostGetPost } from './lib/actions/ai/get-post';
import { ghostGetPostBySlug } from './lib/actions/ai/get-post-by-slug';
import { ghostCreatePost } from './lib/actions/ai/create-post';
import { ghostUpdatePost } from './lib/actions/ai/update-post';
import { ghostPublishPost } from './lib/actions/ai/publish-post';
import { ghostSchedulePost } from './lib/actions/ai/schedule-post';
import { ghostUnpublishPost } from './lib/actions/ai/unpublish-post';
import { ghostCopyPost } from './lib/actions/ai/copy-post';
import { ghostDeletePost } from './lib/actions/ai/delete-post';
import { ghostListPages } from './lib/actions/ai/list-pages';
import { ghostGetPage } from './lib/actions/ai/get-page';
import { ghostGetPageBySlug } from './lib/actions/ai/get-page-by-slug';
import { ghostCreatePage } from './lib/actions/ai/create-page';
import { ghostUpdatePage } from './lib/actions/ai/update-page';
import { ghostCopyPage } from './lib/actions/ai/copy-page';
import { ghostDeletePage } from './lib/actions/ai/delete-page';
import { ghostListTags } from './lib/actions/ai/list-tags';
import { ghostGetTag } from './lib/actions/ai/get-tag';
import { ghostGetTagBySlug } from './lib/actions/ai/get-tag-by-slug';
import { ghostCreateTag } from './lib/actions/ai/create-tag';
import { ghostUpdateTag } from './lib/actions/ai/update-tag';
import { ghostDeleteTag } from './lib/actions/ai/delete-tag';
import { ghostListMembers } from './lib/actions/ai/list-members';
import { ghostGetMember } from './lib/actions/ai/get-member';
import { ghostGetMemberByEmail } from './lib/actions/ai/get-member-by-email';
import { ghostCreateMember } from './lib/actions/ai/create-member';
import { ghostUpdateMember } from './lib/actions/ai/update-member';
import { ghostDeleteMember } from './lib/actions/ai/delete-member';
import { ghostAddMemberLabel } from './lib/actions/ai/add-member-label';
import { ghostRemoveMemberLabel } from './lib/actions/ai/remove-member-label';
import { ghostSubscribeMemberToNewsletters } from './lib/actions/ai/subscribe-member-to-newsletters';
import { ghostUnsubscribeMemberFromNewsletters } from './lib/actions/ai/unsubscribe-member-from-newsletters';
import { ghostListLabels } from './lib/actions/ai/list-labels';
import { ghostGetLabel } from './lib/actions/ai/get-label';
import { ghostCreateLabel } from './lib/actions/ai/create-label';
import { ghostUpdateLabel } from './lib/actions/ai/update-label';
import { ghostDeleteLabel } from './lib/actions/ai/delete-label';
import { ghostListNewsletters } from './lib/actions/ai/list-newsletters';
import { ghostGetNewsletter } from './lib/actions/ai/get-newsletter';
import { ghostCreateNewsletter } from './lib/actions/ai/create-newsletter';
import { ghostUpdateNewsletter } from './lib/actions/ai/update-newsletter';
import { ghostArchiveNewsletter } from './lib/actions/ai/archive-newsletter';
import { ghostListTiers } from './lib/actions/ai/list-tiers';
import { ghostGetTier } from './lib/actions/ai/get-tier';
import { ghostCreateTier } from './lib/actions/ai/create-tier';
import { ghostUpdateTier } from './lib/actions/ai/update-tier';
import { ghostArchiveTier } from './lib/actions/ai/archive-tier';
import { ghostListOffers } from './lib/actions/ai/list-offers';
import { ghostGetOffer } from './lib/actions/ai/get-offer';
import { ghostCreateOffer } from './lib/actions/ai/create-offer';
import { ghostUpdateOffer } from './lib/actions/ai/update-offer';
import { ghostArchiveOffer } from './lib/actions/ai/archive-offer';
import { ghostListUsers } from './lib/actions/ai/list-users';
import { ghostGetUser } from './lib/actions/ai/get-user';
import { ghostGetUserByEmail } from './lib/actions/ai/get-user-by-email';
import { ghostUploadImage } from './lib/actions/ai/upload-image';
import { ghostGetSite } from './lib/actions/ai/get-site';
import { ghostUploadMedia } from './lib/actions/ai/upload-media';
import { ghostUploadFile } from './lib/actions/ai/upload-file';
import { ghostGetSettings } from './lib/actions/ai/get-settings';
import { ghostListMemberActivity } from './lib/actions/ai/list-member-activity';
import { ghostGetMemberStats } from './lib/actions/ai/get-member-stats';
import { common } from './lib/common';
import { ghostClient } from './lib/common/client';
import { assertGhostUrl } from './lib/common/custom-api-guard';
import { memberAdded } from './lib/triggers/member-added';
import { memberDeleted } from './lib/triggers/member-deleted';
import { memberEdited } from './lib/triggers/member-edited';
import { pagePublished } from './lib/triggers/page-published';
import { postPublished } from './lib/triggers/post-published';
import { postScheduled } from './lib/triggers/post-scheduled';

export { ghostAuth };

export const ghostcms = createPiece({
  displayName: 'GhostCMS',
  description: 'Publishing platform for professional bloggers',

  auth: ghostAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/ghostcms.png',
  categories: [PieceCategory.MARKETING],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createMember,
    updateMember,
    createPost,
    findMember,
    findUser,
    ghostListPosts,
    ghostGetPost,
    ghostGetPostBySlug,
    ghostCreatePost,
    ghostUpdatePost,
    ghostPublishPost,
    ghostSchedulePost,
    ghostUnpublishPost,
    ghostCopyPost,
    ghostDeletePost,
    ghostListPages,
    ghostGetPage,
    ghostGetPageBySlug,
    ghostCreatePage,
    ghostUpdatePage,
    ghostCopyPage,
    ghostDeletePage,
    ghostListTags,
    ghostGetTag,
    ghostGetTagBySlug,
    ghostCreateTag,
    ghostUpdateTag,
    ghostDeleteTag,
    ghostListMembers,
    ghostGetMember,
    ghostGetMemberByEmail,
    ghostCreateMember,
    ghostUpdateMember,
    ghostDeleteMember,
    ghostAddMemberLabel,
    ghostRemoveMemberLabel,
    ghostSubscribeMemberToNewsletters,
    ghostUnsubscribeMemberFromNewsletters,
    ghostListLabels,
    ghostGetLabel,
    ghostCreateLabel,
    ghostUpdateLabel,
    ghostDeleteLabel,
    ghostListNewsletters,
    ghostGetNewsletter,
    ghostCreateNewsletter,
    ghostUpdateNewsletter,
    ghostArchiveNewsletter,
    ghostListTiers,
    ghostGetTier,
    ghostCreateTier,
    ghostUpdateTier,
    ghostArchiveTier,
    ghostListOffers,
    ghostGetOffer,
    ghostCreateOffer,
    ghostUpdateOffer,
    ghostArchiveOffer,
    ghostListUsers,
    ghostGetUser,
    ghostGetUserByEmail,
    ghostUploadImage,
    ghostGetSite,
    ghostUploadMedia,
    ghostUploadFile,
    ghostGetSettings,
    ghostListMemberActivity,
    ghostGetMemberStats,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? ghostClient.adminUrl(auth) : ''),
      auth: ghostAuth,
      authMapping: async (auth, propsValue) => {
        assertGhostUrl({ auth, propsValue });
        return {
          Authorization: `Ghost ${common.jwtFromApiKey(auth.props.apiKey)}`,
        };
      },
    }),
  ],
  triggers: [
    memberAdded,
    memberEdited,
    memberDeleted,
    postPublished,
    postScheduled,
    pagePublished,
  ],
});
