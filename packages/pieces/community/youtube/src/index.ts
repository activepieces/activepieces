import {
  createPiece,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { youtubeNewVideoTrigger } from './lib/triggers/new-video.trigger';
import { youtubeAuth } from './lib/common/auth';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { youtubeListPlaylistItemsAction } from './lib/actions/list-playlist-items';
import { youtubeSearchAction } from './lib/actions/search';
import { youtubeListCaptionsAction } from './lib/actions/list-captions';
import { youtubeDownloadCaptionAction } from './lib/actions/download-caption';
import { youtubeGetVideoAction } from './lib/actions/get-video';
import { youtubeGetChannelAction } from './lib/actions/get-channel';
import { youtubeListPlaylistsAction } from './lib/actions/list-playlists';
import { youtubeListCommentsAction } from './lib/actions/list-comments';
import { youtubeCreatePlaylistAction } from './lib/actions/create-playlist';
import { youtubeUpdatePlaylistAction } from './lib/actions/update-playlist';
import { youtubeDeletePlaylistAction } from './lib/actions/delete-playlist';
import { youtubeAddVideoToPlaylistAction } from './lib/actions/add-video-to-playlist';
import { youtubeRemoveVideoFromPlaylistAction } from './lib/actions/remove-video-from-playlist';
import { youtubePostVideoCommentAction } from './lib/actions/post-video-comment';
import { youtubeReplyToCommentAction } from './lib/actions/reply-to-comment';
import { youtubeDeleteCommentAction } from './lib/actions/delete-comment';
import { youtubeSetCommentModerationStatusAction } from './lib/actions/set-comment-moderation-status';
import { youtubeRateVideoAction } from './lib/actions/rate-video';
import { youtubeGetVideoRatingAction } from './lib/actions/get-video-rating';
import { youtubeListChannelActivitiesAction } from './lib/actions/list-channel-activities';
import { youtubeListMySubscriptionsAction } from './lib/actions/list-my-subscriptions';
import { youtubeListTrendingVideosAction } from './lib/actions/list-trending-videos';
import { youtubeListChannelVideosAction } from './lib/actions/list-channel-videos';
import { youtubeUpdateVideoMetadataAction } from './lib/actions/update-video-metadata';
import { youtubeSearchYoutubeAction } from './lib/actions/search-youtube';
import { youtubeGetVideoDetailsAction } from './lib/actions/get-video-details';
import { youtubeGetChannelDetailsAction } from './lib/actions/get-channel-details';
import { youtubeListChannelPlaylistsAction } from './lib/actions/list-channel-playlists';
import { youtubeListPlaylistVideosAction } from './lib/actions/list-playlist-videos';
import { youtubeListCommentThreadsAction } from './lib/actions/list-comment-threads';
import { youtubeListCaptionTracksAction } from './lib/actions/list-caption-tracks';
import { youtubeDownloadCaptionTrackAction } from './lib/actions/download-caption-track';

export const youtube = createPiece({
  displayName: 'YouTube',
  description:
    'Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/youtube.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: youtubeAuth,
  authors: [
    'abaza738',
    'kishanprmr',
    'khaledmashaly',
    'abuaboud',
    'hugh-codes',
    'sanket-a11y',
  ],
  actions: [
    youtubeDownloadCaptionAction,
    youtubeListCaptionsAction,
    youtubeSearchAction,
    youtubeListPlaylistItemsAction,
    youtubeGetVideoAction,
    youtubeGetChannelAction,
    youtubeListPlaylistsAction,
    youtubeListCommentsAction,
    youtubeCreatePlaylistAction,
    youtubeUpdatePlaylistAction,
    youtubeDeletePlaylistAction,
    youtubeAddVideoToPlaylistAction,
    youtubeRemoveVideoFromPlaylistAction,
    youtubePostVideoCommentAction,
    youtubeReplyToCommentAction,
    youtubeDeleteCommentAction,
    youtubeSetCommentModerationStatusAction,
    youtubeRateVideoAction,
    youtubeGetVideoRatingAction,
    youtubeListChannelActivitiesAction,
    youtubeListMySubscriptionsAction,
    youtubeListTrendingVideosAction,
    youtubeListChannelVideosAction,
    youtubeUpdateVideoMetadataAction,
    youtubeSearchYoutubeAction,
    youtubeGetVideoDetailsAction,
    youtubeGetChannelDetailsAction,
    youtubeListChannelPlaylistsAction,
    youtubeListPlaylistVideosAction,
    youtubeListCommentThreadsAction,
    youtubeListCaptionTracksAction,
    youtubeDownloadCaptionTrackAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://www.googleapis.com/youtube/v3',
      auth: youtubeAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [youtubeNewVideoTrigger],
});
