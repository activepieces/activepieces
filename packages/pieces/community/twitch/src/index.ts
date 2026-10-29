import { createPiece } from '@activepieces/pieces-framework';
import { streamStarted } from './lib/triggers/stream-started';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { twitchAuth } from './lib/auth';
import { getUsers } from './lib/actions/get-users';
import { getLiveStreams } from './lib/actions/get-live-streams';
import { searchChannels } from './lib/actions/search-channels';
import { searchCategories } from './lib/actions/search-categories';
import { getChannelInfo } from './lib/actions/get-channel-info';
import { getVideos } from './lib/actions/get-videos';
import { getClips } from './lib/actions/get-clips';
import { updateChannelInfo } from './lib/actions/update-channel-info';
import { sendChatMessage } from './lib/actions/send-chat-message';
import { sendAnnouncement } from './lib/actions/send-announcement';
import { getGames } from './lib/actions/get-games';
import { getTopGames } from './lib/actions/get-top-games';
import { getChannelSchedule } from './lib/actions/get-channel-schedule';
import { getChannelEmotes } from './lib/actions/get-channel-emotes';
import { getGlobalEmotes } from './lib/actions/get-global-emotes';
import { getChannelChatBadges } from './lib/actions/get-channel-chat-badges';
import { getGlobalChatBadges } from './lib/actions/get-global-chat-badges';
import { getChannelTeams } from './lib/actions/get-channel-teams';
import { getTeam } from './lib/actions/get-team';
import { createStreamMarker } from './lib/actions/create-stream-marker';
import { getStreamMarkers } from './lib/actions/get-stream-markers';
import { createClip } from './lib/actions/create-clip';
import { getChannelFollowers } from './lib/actions/get-channel-followers';
import { getFollowedChannels } from './lib/actions/get-followed-channels';
import { getFollowedStreams } from './lib/actions/get-followed-streams';
import { getChatters } from './lib/actions/get-chatters';
import { banUser } from './lib/actions/ban-user';
import { timeoutUser } from './lib/actions/timeout-user';
import { unbanUser } from './lib/actions/unban-user';
import { getBannedUsers } from './lib/actions/get-banned-users';
import { getModerators } from './lib/actions/get-moderators';
import { getVips } from './lib/actions/get-vips';
import { addModerator } from './lib/actions/add-moderator';
import { removeModerator } from './lib/actions/remove-moderator';
import { getChatSettings } from './lib/actions/get-chat-settings';
import { updateChatSettings } from './lib/actions/update-chat-settings';
import { getShieldModeStatus } from './lib/actions/get-shield-mode-status';
import { updateShieldMode } from './lib/actions/update-shield-mode';
import { deleteChatMessage } from './lib/actions/delete-chat-message';
import { clearChat } from './lib/actions/clear-chat';
import { warnUser } from './lib/actions/warn-user';
import { getPolls } from './lib/actions/get-polls';
import { getPredictions } from './lib/actions/get-predictions';
import { createScheduleSegment } from './lib/actions/create-schedule-segment';
import { updateScheduleSegment } from './lib/actions/update-schedule-segment';
import { deleteScheduleSegment } from './lib/actions/delete-schedule-segment';
import { sendShoutout } from './lib/actions/send-shoutout';
import { getBroadcasterSubscriptions } from './lib/actions/get-broadcaster-subscriptions';
import { checkUserSubscription } from './lib/actions/check-user-subscription';
import { startCommercial } from './lib/actions/start-commercial';
import { getAdSchedule } from './lib/actions/get-ad-schedule';

export const twitch = createPiece({
  displayName: 'Twitch',
  auth: twitchAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/twitch.png',
  authors: ['arinmakk', 'sanket-a11y'],
  description:
    "Twitch is the world's leading live streaming platform for gamers and the things we love!",
  actions: [
    getUsers,
    getLiveStreams,
    searchChannels,
    searchCategories,
    getChannelInfo,
    getVideos,
    getClips,
    updateChannelInfo,
    sendChatMessage,
    sendAnnouncement,
    getGames,
    getTopGames,
    getChannelSchedule,
    getChannelEmotes,
    getGlobalEmotes,
    getChannelChatBadges,
    getGlobalChatBadges,
    getChannelTeams,
    getTeam,
    createStreamMarker,
    getStreamMarkers,
    createClip,
    getChannelFollowers,
    getFollowedChannels,
    getFollowedStreams,
    getChatters,
    banUser,
    timeoutUser,
    unbanUser,
    getBannedUsers,
    getModerators,
    getVips,
    addModerator,
    removeModerator,
    getChatSettings,
    updateChatSettings,
    getShieldModeStatus,
    updateShieldMode,
    deleteChatMessage,
    clearChat,
    warnUser,
    getPolls,
    getPredictions,
    createScheduleSegment,
    updateScheduleSegment,
    deleteScheduleSegment,
    sendShoutout,
    getBroadcasterSubscriptions,
    checkUserSubscription,
    startCommercial,
    getAdSchedule,
    createCustomApiCallAction({
      auth: twitchAuth,
      baseUrl: () => `https://api.twitch.tv/helix`,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          'Client-ID': auth.client_id,
        };
      },
    }),
  ],
  triggers: [streamStarted],
});
