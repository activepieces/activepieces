import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { getAccountInsights } from './lib/actions/account/get-account-insights';
import { getContentPublishingLimit } from './lib/actions/account/get-content-publishing-limit';
import { getProfile } from './lib/actions/account/get-profile';
import { createComment } from './lib/actions/comments/create-comment';
import { deleteComment } from './lib/actions/comments/delete-comment';
import { getComment } from './lib/actions/comments/get-comment';
import { listCommentReplies } from './lib/actions/comments/list-comment-replies';
import { listMediaComments } from './lib/actions/comments/list-media-comments';
import { replyToComment } from './lib/actions/comments/reply-to-comment';
import { setCommentVisibility } from './lib/actions/comments/set-comment-visibility';
import { deleteMedia } from './lib/actions/media/delete-media';
import { getMedia } from './lib/actions/media/get-media';
import { getMediaInsights } from './lib/actions/media/get-media-insights';
import { listCarouselChildren } from './lib/actions/media/list-carousel-children';
import { listMedia } from './lib/actions/media/list-media';
import { listStories } from './lib/actions/media/list-stories';
import { listTaggedMedia } from './lib/actions/media/list-tagged-media';
import { setMediaCommentsEnabled } from './lib/actions/media/set-media-comments-enabled';
import { listConversations } from './lib/actions/messaging/list-conversations';
import { listMessages } from './lib/actions/messaging/list-messages';
import { sendMediaMessage } from './lib/actions/messaging/send-media-message';
import { sendMessage } from './lib/actions/messaging/send-message';
import { sendPrivateReply } from './lib/actions/messaging/send-private-reply';
import { publishCarousel } from './lib/actions/publishing/publish-carousel';
import { publishStory } from './lib/actions/publishing/publish-story';
import { uploadPhoto } from './lib/actions/publishing/upload-photo';
import { uploadReel } from './lib/actions/publishing/upload-reel';
import { instagramCommon } from './lib/common';

export const instagramBusiness = createPiece({
  displayName: 'Instagram for Business',
  description: 'Grow your business on Instagram',
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/instagram.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  auth: instagramCommon.authentication,
  actions: [
    uploadPhoto,
    uploadReel,
    publishStory,
    publishCarousel,
    getProfile,
    getAccountInsights,
    getContentPublishingLimit,
    listMedia,
    getMedia,
    getMediaInsights,
    listCarouselChildren,
    listStories,
    listTaggedMedia,
    deleteMedia,
    setMediaCommentsEnabled,
    listMediaComments,
    getComment,
    listCommentReplies,
    createComment,
    replyToComment,
    setCommentVisibility,
    deleteComment,
    listConversations,
    listMessages,
    sendMessage,
    sendMediaMessage,
    sendPrivateReply,
  ],
  triggers: [],
});
