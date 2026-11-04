import { assignBotAction } from './bots/assign-bot';
import { convertBotToUserAction } from './bots/convert-bot-to-user';
import { convertUserToBotAction } from './bots/convert-user-to-bot';
import { createBotAction } from './bots/create-bot';
import { disableBotAction } from './bots/disable-bot';
import { enableBotAction } from './bots/enable-bot';
import { getBotAction } from './bots/get-bot';
import { listBotsAction } from './bots/list-bots';
import { updateBotAction } from './bots/update-bot';
import { addChannelMemberAction } from './channels/add-channel-member';
import { archiveChannelAction } from './channels/archive-channel';
import { convertGroupMessageToChannelAction } from './channels/convert-group-message-to-channel';
import { createChannelCategoryAction } from './channels/create-channel-category';
import { createChannelAction } from './channels/create-channel';
import { createDirectChannelAction } from './channels/create-direct-channel';
import { createGroupMessageAction } from './channels/create-group-message';
import { deleteChannelCategoryAction } from './channels/delete-channel-category';
import { getChannelByNameAction } from './channels/get-channel-by-name';
import { getChannelCategoryOrderAction } from './channels/get-channel-category-order';
import { getChannelCategoryAction } from './channels/get-channel-category';
import { getChannelMemberCountsAction } from './channels/get-channel-member-counts';
import { getChannelMemberAction } from './channels/get-channel-member';
import { getChannelMembersByIdsAction } from './channels/get-channel-members-by-ids';
import { getChannelStatsAction } from './channels/get-channel-stats';
import { getChannelUnreadAction } from './channels/get-channel-unread';
import { getChannelAction } from './channels/get-channel';
import { getChannelsByIdsAction } from './channels/get-channels-by-ids';
import { listAllChannelsAction } from './channels/list-all-channels';
import { listArchivedChannelsAction } from './channels/list-archived-channels';
import { listChannelCategoriesAction } from './channels/list-channel-categories';
import { listChannelMembersAction } from './channels/list-channel-members';
import { listChannelTimezonesAction } from './channels/list-channel-timezones';
import { listGroupChannelCommonTeamsAction } from './channels/list-group-channel-common-teams';
import { listPinnedPostsAction } from './channels/list-pinned-posts';
import { listPrivateChannelsAction } from './channels/list-private-channels';
import { listPublicChannelsAction } from './channels/list-public-channels';
import { listUserChannelsAction } from './channels/list-user-channels';
import { listUserTeamChannelMembershipsAction } from './channels/list-user-team-channel-memberships';
import { listUserTeamChannelsAction } from './channels/list-user-team-channels';
import { markChannelsReadAction } from './channels/mark-channels-read';
import { moveChannelAction } from './channels/move-channel';
import { patchChannelAction } from './channels/patch-channel';
import { removeChannelMemberAction } from './channels/remove-channel-member';
import { restoreChannelAction } from './channels/restore-channel';
import { searchAllChannelsAction } from './channels/search-all-channels';
import { searchChannelsAction } from './channels/search-channels';
import { searchGroupChannelsAction } from './channels/search-group-channels';
import { setChannelMembersAction } from './channels/set-channel-members';
import { updateChannelCategoriesAction } from './channels/update-channel-categories';
import { updateChannelCategoryOrderAction } from './channels/update-channel-category-order';
import { updateChannelCategoryAction } from './channels/update-channel-category';
import { updateChannelMemberRolesAction } from './channels/update-channel-member-roles';
import { updateChannelNotifyPropsAction } from './channels/update-channel-notify-props';
import { updateChannelPrivacyAction } from './channels/update-channel-privacy';
import { createCommandAction } from './commands/create-command';
import { deleteCommandAction } from './commands/delete-command';
import { executeCommandAction } from './commands/execute-command';
import { getCommandAction } from './commands/get-command';
import { listCommandsAction } from './commands/list-commands';
import { moveCommandAction } from './commands/move-command';
import { regenerateCommandTokenAction } from './commands/regenerate-command-token';
import { updateCommandAction } from './commands/update-command';
import { createEmojiAction } from './emoji/create-emoji';
import { deleteEmojiAction } from './emoji/delete-emoji';
import { getEmojiByNameAction } from './emoji/get-emoji-by-name';
import { getEmojiImageAction } from './emoji/get-emoji-image';
import { getEmojiAction } from './emoji/get-emoji';
import { getEmojisByNamesAction } from './emoji/get-emojis-by-names';
import { listEmojisAction } from './emoji/list-emojis';
import { searchEmojisAction } from './emoji/search-emojis';
import { downloadFileAction } from './files/download-file';
import { getFileInfoAction } from './files/get-file-info';
import { getFilePreviewAction } from './files/get-file-preview';
import { getFilePublicLinkAction } from './files/get-file-public-link';
import { getFileThumbnailAction } from './files/get-file-thumbnail';
import { searchFilesAction } from './files/search-files';
import { uploadFileAction } from './files/upload-file';
import { createPostAction } from './posts/create-post';
import { deletePostAction } from './posts/delete-post';
import { getPostEditHistoryAction } from './posts/get-post-edit-history';
import { getPostInfoAction } from './posts/get-post-info';
import { getPostThreadAction } from './posts/get-post-thread';
import { getPostAction } from './posts/get-post';
import { getPostsByIdsAction } from './posts/get-posts-by-ids';
import { listChannelPostsAction } from './posts/list-channel-posts';
import { listFlaggedPostsAction } from './posts/list-flagged-posts';
import { listPostFilesAction } from './posts/list-post-files';
import { listUnreadPostsAction } from './posts/list-unread-posts';
import { markPostUnreadAction } from './posts/mark-post-unread';
import { patchPostAction } from './posts/patch-post';
import { pinPostAction } from './posts/pin-post';
import { restorePostVersionAction } from './posts/restore-post-version';
import { searchPostsAction } from './posts/search-posts';
import { sendEphemeralPostAction } from './posts/send-ephemeral-post';
import { setPostReminderAction } from './posts/set-post-reminder';
import { unpinPostAction } from './posts/unpin-post';
import { deletePreferencesAction } from './preferences/delete-preferences';
import { getPreferenceAction } from './preferences/get-preference';
import { listPreferencesByCategoryAction } from './preferences/list-preferences-by-category';
import { listPreferencesAction } from './preferences/list-preferences';
import { savePreferencesAction } from './preferences/save-preferences';
import { addReactionAction } from './reactions/add-reaction';
import { listReactionsAction } from './reactions/list-reactions';
import { removeReactionAction } from './reactions/remove-reaction';
import { countUserReportsAction } from './reports/count-user-reports';
import { listUserReportsAction } from './reports/list-user-reports';
import { getRoleByNameAction } from './roles/get-role-by-name';
import { getRoleAction } from './roles/get-role';
import { getRolesByNamesAction } from './roles/get-roles-by-names';
import { listRolesAction } from './roles/list-roles';
import { patchRoleAction } from './roles/patch-role';
import { clearCustomStatusAction } from './status/clear-custom-status';
import { getUserStatusAction } from './status/get-user-status';
import { getUserStatusesAction } from './status/get-user-statuses';
import { removeRecentCustomStatusAction } from './status/remove-recent-custom-status';
import { setCustomStatusAction } from './status/set-custom-status';
import { updateUserStatusAction } from './status/update-user-status';
import { addTeamMemberAction } from './teams/add-team-member';
import { addTeamMembersAction } from './teams/add-team-members';
import { archiveTeamAction } from './teams/archive-team';
import { checkTeamExistsAction } from './teams/check-team-exists';
import { createTeamAction } from './teams/create-team';
import { getTeamByNameAction } from './teams/get-team-by-name';
import { getTeamIconAction } from './teams/get-team-icon';
import { getTeamInviteInfoAction } from './teams/get-team-invite-info';
import { getTeamMemberAction } from './teams/get-team-member';
import { getTeamMembersByIdsAction } from './teams/get-team-members-by-ids';
import { getTeamStatsAction } from './teams/get-team-stats';
import { getTeamUnreadAction } from './teams/get-team-unread';
import { getTeamAction } from './teams/get-team';
import { invalidateEmailInvitesAction } from './teams/invalidate-email-invites';
import { inviteUsersByEmailAction } from './teams/invite-users-by-email';
import { joinTeamByInviteAction } from './teams/join-team-by-invite';
import { listTeamMembersAction } from './teams/list-team-members';
import { listTeamUnreadsAction } from './teams/list-team-unreads';
import { listTeamsAction } from './teams/list-teams';
import { listUserTeamMembershipsAction } from './teams/list-user-team-memberships';
import { listUserTeamsAction } from './teams/list-user-teams';
import { patchTeamAction } from './teams/patch-team';
import { regenerateTeamInviteIdAction } from './teams/regenerate-team-invite-id';
import { removeTeamIconAction } from './teams/remove-team-icon';
import { removeTeamMemberAction } from './teams/remove-team-member';
import { restoreTeamAction } from './teams/restore-team';
import { searchTeamsAction } from './teams/search-teams';
import { setTeamIconAction } from './teams/set-team-icon';
import { updateTeamMemberRolesAction } from './teams/update-team-member-roles';
import { updateTeamPrivacyAction } from './teams/update-team-privacy';
import { followThreadAction } from './threads/follow-thread';
import { getThreadAction } from './threads/get-thread';
import { listThreadsAction } from './threads/list-threads';
import { markAllThreadsReadAction } from './threads/mark-all-threads-read';
import { markThreadReadAction } from './threads/mark-thread-read';
import { markThreadUnreadAction } from './threads/mark-thread-unread';
import { unfollowThreadAction } from './threads/unfollow-thread';
import { createUserAction } from './users/create-user';
import { deleteDraftAction } from './users/delete-draft';
import { deleteThreadDraftAction } from './users/delete-thread-draft';
import { getFilteredUserStatsAction } from './users/get-filtered-user-stats';
import { getServerLimitsAction } from './users/get-server-limits';
import { getUserByEmailAction } from './users/get-user-by-email';
import { getUserByUsernameAction } from './users/get-user-by-username';
import { getUserDefaultImageAction } from './users/get-user-default-image';
import { getUserImageAction } from './users/get-user-image';
import { getUserStatsAction } from './users/get-user-stats';
import { getUserAction } from './users/get-user';
import { getUsersByIdsAction } from './users/get-users-by-ids';
import { getUsersByUsernamesAction } from './users/get-users-by-usernames';
import { listDraftsAction } from './users/list-drafts';
import { listGroupChannelUsersAction } from './users/list-group-channel-users';
import { listKnownUsersAction } from './users/list-known-users';
import { listUserChannelMembershipsAction } from './users/list-user-channel-memberships';
import { listUsersAction } from './users/list-users';
import { patchUserAction } from './users/patch-user';
import { resetUserImageAction } from './users/reset-user-image';
import { searchUsersAction } from './users/search-users';
import { setUserActiveAction } from './users/set-user-active';
import { setUserImageAction } from './users/set-user-image';
import { updateUserRolesAction } from './users/update-user-roles';
import { upsertDraftAction } from './users/upsert-draft';

export const mattermostAiActions = [
  assignBotAction,
  convertBotToUserAction,
  convertUserToBotAction,
  createBotAction,
  disableBotAction,
  enableBotAction,
  getBotAction,
  listBotsAction,
  updateBotAction,
  addChannelMemberAction,
  archiveChannelAction,
  convertGroupMessageToChannelAction,
  createChannelCategoryAction,
  createChannelAction,
  createDirectChannelAction,
  createGroupMessageAction,
  deleteChannelCategoryAction,
  getChannelByNameAction,
  getChannelCategoryOrderAction,
  getChannelCategoryAction,
  getChannelMemberCountsAction,
  getChannelMemberAction,
  getChannelMembersByIdsAction,
  getChannelStatsAction,
  getChannelUnreadAction,
  getChannelAction,
  getChannelsByIdsAction,
  listAllChannelsAction,
  listArchivedChannelsAction,
  listChannelCategoriesAction,
  listChannelMembersAction,
  listChannelTimezonesAction,
  listGroupChannelCommonTeamsAction,
  listPinnedPostsAction,
  listPrivateChannelsAction,
  listPublicChannelsAction,
  listUserChannelsAction,
  listUserTeamChannelMembershipsAction,
  listUserTeamChannelsAction,
  markChannelsReadAction,
  moveChannelAction,
  patchChannelAction,
  removeChannelMemberAction,
  restoreChannelAction,
  searchAllChannelsAction,
  searchChannelsAction,
  searchGroupChannelsAction,
  setChannelMembersAction,
  updateChannelCategoriesAction,
  updateChannelCategoryOrderAction,
  updateChannelCategoryAction,
  updateChannelMemberRolesAction,
  updateChannelNotifyPropsAction,
  updateChannelPrivacyAction,
  createCommandAction,
  deleteCommandAction,
  executeCommandAction,
  getCommandAction,
  listCommandsAction,
  moveCommandAction,
  regenerateCommandTokenAction,
  updateCommandAction,
  createEmojiAction,
  deleteEmojiAction,
  getEmojiByNameAction,
  getEmojiImageAction,
  getEmojiAction,
  getEmojisByNamesAction,
  listEmojisAction,
  searchEmojisAction,
  downloadFileAction,
  getFileInfoAction,
  getFilePreviewAction,
  getFilePublicLinkAction,
  getFileThumbnailAction,
  searchFilesAction,
  uploadFileAction,
  createPostAction,
  deletePostAction,
  getPostEditHistoryAction,
  getPostInfoAction,
  getPostThreadAction,
  getPostAction,
  getPostsByIdsAction,
  listChannelPostsAction,
  listFlaggedPostsAction,
  listPostFilesAction,
  listUnreadPostsAction,
  markPostUnreadAction,
  patchPostAction,
  pinPostAction,
  restorePostVersionAction,
  searchPostsAction,
  sendEphemeralPostAction,
  setPostReminderAction,
  unpinPostAction,
  deletePreferencesAction,
  getPreferenceAction,
  listPreferencesByCategoryAction,
  listPreferencesAction,
  savePreferencesAction,
  addReactionAction,
  listReactionsAction,
  removeReactionAction,
  countUserReportsAction,
  listUserReportsAction,
  getRoleByNameAction,
  getRoleAction,
  getRolesByNamesAction,
  listRolesAction,
  patchRoleAction,
  clearCustomStatusAction,
  getUserStatusAction,
  getUserStatusesAction,
  removeRecentCustomStatusAction,
  setCustomStatusAction,
  updateUserStatusAction,
  addTeamMemberAction,
  addTeamMembersAction,
  archiveTeamAction,
  checkTeamExistsAction,
  createTeamAction,
  getTeamByNameAction,
  getTeamIconAction,
  getTeamInviteInfoAction,
  getTeamMemberAction,
  getTeamMembersByIdsAction,
  getTeamStatsAction,
  getTeamUnreadAction,
  getTeamAction,
  invalidateEmailInvitesAction,
  inviteUsersByEmailAction,
  joinTeamByInviteAction,
  listTeamMembersAction,
  listTeamUnreadsAction,
  listTeamsAction,
  listUserTeamMembershipsAction,
  listUserTeamsAction,
  patchTeamAction,
  regenerateTeamInviteIdAction,
  removeTeamIconAction,
  removeTeamMemberAction,
  restoreTeamAction,
  searchTeamsAction,
  setTeamIconAction,
  updateTeamMemberRolesAction,
  updateTeamPrivacyAction,
  followThreadAction,
  getThreadAction,
  listThreadsAction,
  markAllThreadsReadAction,
  markThreadReadAction,
  markThreadUnreadAction,
  unfollowThreadAction,
  createUserAction,
  deleteDraftAction,
  deleteThreadDraftAction,
  getFilteredUserStatsAction,
  getServerLimitsAction,
  getUserByEmailAction,
  getUserByUsernameAction,
  getUserDefaultImageAction,
  getUserImageAction,
  getUserStatsAction,
  getUserAction,
  getUsersByIdsAction,
  getUsersByUsernamesAction,
  listDraftsAction,
  listGroupChannelUsersAction,
  listKnownUsersAction,
  listUserChannelMembershipsAction,
  listUsersAction,
  patchUserAction,
  resetUserImageAction,
  searchUsersAction,
  setUserActiveAction,
  setUserImageAction,
  updateUserRolesAction,
  upsertDraftAction,
];
