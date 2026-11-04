import { getChannelMessageById } from './channel-messages/get-channel-message-by-id';
import { getChannelMessageHostedContent } from './channel-messages/get-channel-message-hosted-content';
import { listChannelMessageHostedContents } from './channel-messages/list-channel-message-hosted-contents';
import { listChannelMessageReplies } from './channel-messages/list-channel-message-replies';
import { listChannelMessages } from './channel-messages/list-channel-messages';
import { postChannelMessage } from './channel-messages/post-channel-message';
import { postChannelMessageReply } from './channel-messages/post-channel-message-reply';
import { setChannelMessageReaction } from './channel-messages/set-channel-message-reaction';
import { unsetChannelMessageReaction } from './channel-messages/unset-channel-message-reaction';
import { createTeamChannel } from './channels/create-team-channel';
import { getChannel } from './channels/get-channel';
import { getPrimaryChannel } from './channels/get-primary-channel';
import { listAllChannels } from './channels/list-all-channels';
import { listChannels } from './channels/list-channels';
import { listIncomingChannels } from './channels/list-incoming-channels';
import { getChatMessageById } from './chat-messages/get-chat-message-by-id';
import { getChatMessageHostedContent } from './chat-messages/get-chat-message-hosted-content';
import { listChatMessageHostedContents } from './chat-messages/list-chat-message-hosted-contents';
import { listChatMessages } from './chat-messages/list-chat-messages';
import { postChatMessage } from './chat-messages/post-chat-message';
import { setChatMessageReaction } from './chat-messages/set-chat-message-reaction';
import { softDeleteChatMessage } from './chat-messages/soft-delete-chat-message';
import { undoSoftDeleteChatMessage } from './chat-messages/undo-soft-delete-chat-message';
import { unsetChatMessageReaction } from './chat-messages/unset-chat-message-reaction';
import { updateChatMessage } from './chat-messages/update-chat-message';
import { addChatMember } from './chats/add-chat-member';
import { createChat } from './chats/create-chat';
import { getChat } from './chats/get-chat';
import { getChatMember } from './chats/get-chat-member';
import { hideChat } from './chats/hide-chat';
import { listChatMembers } from './chats/list-chat-members';
import { listChats } from './chats/list-chats';
import { listPinnedChatMessages } from './chats/list-pinned-chat-messages';
import { markChatRead } from './chats/mark-chat-read';
import { markChatUnread } from './chats/mark-chat-unread';
import { pinChatMessage } from './chats/pin-chat-message';
import { unhideChat } from './chats/unhide-chat';
import { unpinChatMessage } from './chats/unpin-chat-message';
import { updateChat } from './chats/update-chat';
import { getMeetingRecordingDetails } from './meetings/get-meeting-recording-details';
import { getMeetingTranscriptContent } from './meetings/get-meeting-transcript-content';
import { getMeetingTranscriptDetails } from './meetings/get-meeting-transcript-details';
import { listMeetingRecordings } from './meetings/list-meeting-recordings';
import { listMeetingTranscripts } from './meetings/list-meeting-transcripts';
import { getTeamMember } from './members/get-team-member';
import { listTeamMembers } from './members/list-team-members';
import { getMyPresence } from './presence/get-my-presence';
import { getPresencesByUserIds } from './presence/get-presences-by-user-ids';
import { getUserPresence } from './presence/get-user-presence';
import { searchMessages } from './search/search-messages';
import { getTeam } from './teams/get-team';
import { listAssociatedTeams } from './teams/list-associated-teams';
import { listDeletedTeams } from './teams/list-deleted-teams';
import { listJoinedTeams } from './teams/list-joined-teams';
import { listTeams } from './teams/list-teams';
import { getCurrentUser } from './users/get-current-user';
import { getTeamsLicensingDetails } from './users/get-teams-licensing-details';
import { getUser } from './users/get-user';
import { listUsers } from './users/list-users';

export const microsoftTeamsAiActions = [
  getTeam,
  listAssociatedTeams,
  listDeletedTeams,
  listJoinedTeams,
  listTeams,
  createTeamChannel,
  getChannel,
  getPrimaryChannel,
  listAllChannels,
  listChannels,
  listIncomingChannels,
  getChannelMessageById,
  getChannelMessageHostedContent,
  listChannelMessageHostedContents,
  listChannelMessageReplies,
  listChannelMessages,
  postChannelMessageReply,
  postChannelMessage,
  setChannelMessageReaction,
  unsetChannelMessageReaction,
  addChatMember,
  createChat,
  getChatMember,
  getChat,
  hideChat,
  listChatMembers,
  listChats,
  listPinnedChatMessages,
  markChatRead,
  markChatUnread,
  pinChatMessage,
  unhideChat,
  unpinChatMessage,
  updateChat,
  getChatMessageById,
  getChatMessageHostedContent,
  listChatMessageHostedContents,
  listChatMessages,
  postChatMessage,
  setChatMessageReaction,
  softDeleteChatMessage,
  undoSoftDeleteChatMessage,
  unsetChatMessageReaction,
  updateChatMessage,
  getTeamMember,
  listTeamMembers,
  getCurrentUser,
  getTeamsLicensingDetails,
  getUser,
  listUsers,
  getMyPresence,
  getPresencesByUserIds,
  getUserPresence,
  getMeetingRecordingDetails,
  getMeetingTranscriptContent,
  getMeetingTranscriptDetails,
  listMeetingRecordings,
  listMeetingTranscripts,
  searchMessages,
];
