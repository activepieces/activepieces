import { OutputSchema } from '@activepieces/pieces-framework';

const countField: OutputSchema['fields'][number] = { key: 'count', label: 'Count', format: 'number' };

const userNotifyPropsFields: OutputSchema['fields'] = [
  { key: 'channel', label: 'Channel Mentions' },
  { key: 'channel_mention_auto_follow_threads', label: 'Auto Follow Threads On Channel Mention' },
  { key: 'comments', label: 'Comment Notifications' },
  { key: 'desktop', label: 'Desktop Notifications' },
  { key: 'desktop_sound', label: 'Desktop Sound' },
  { key: 'desktop_threads', label: 'Desktop Thread Notifications' },
  { key: 'email', label: 'Email Notifications' },
  { key: 'email_threads', label: 'Email Thread Notifications' },
  { key: 'first_name', label: 'Notify On First Name' },
  { key: 'mention_keys', label: 'Mention Keys' },
  { key: 'push', label: 'Push Notifications' },
  { key: 'push_status', label: 'Push Status' },
  { key: 'push_threads', label: 'Push Thread Notifications' },
];

const timezoneFields: OutputSchema['fields'] = [
  { key: 'automaticTimezone', label: 'Automatic Timezone' },
  { key: 'manualTimezone', label: 'Manual Timezone' },
  { key: 'useAutomaticTimezone', label: 'Use Automatic Timezone' },
];

const userCoreFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'username', label: 'Username' },
  { key: 'auth_service', label: 'Auth Service' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'nickname', label: 'Nickname' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'position', label: 'Position' },
  { key: 'roles', label: 'Roles' },
  { key: 'notify_props', label: 'Notification Settings', children: userNotifyPropsFields },
  { key: 'locale', label: 'Locale' },
  { key: 'timezone', label: 'Timezone', children: timezoneFields },
  { key: 'disable_welcome_email', label: 'Welcome Email Disabled', format: 'boolean' },
];

const passwordUpdatedField: OutputSchema['fields'][number] = {
  key: 'last_password_update',
  label: 'Password Last Updated',
  format: 'datetime',
};

const pictureUpdatedField: OutputSchema['fields'][number] = {
  key: 'last_picture_update',
  label: 'Picture Last Updated',
  format: 'datetime',
};

const userFields: OutputSchema['fields'] = [
  ...userCoreFields,
  { key: 'remote_id', label: 'Remote ID' },
];

const threadParticipantFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'username', label: 'Username' },
  { key: 'auth_data', label: 'Auth Data' },
  { key: 'auth_service', label: 'Auth Service' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'nickname', label: 'Nickname' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'position', label: 'Position' },
  { key: 'roles', label: 'Roles' },
  { key: 'locale', label: 'Locale' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'disable_welcome_email', label: 'Welcome Email Disabled', format: 'boolean' },
];

const channelFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Channel ID' },
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'team_id', label: 'Team ID' },
  { key: 'type', label: 'Type' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'name', label: 'Name' },
  { key: 'header', label: 'Header' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'last_post_at', label: 'Last Post At', format: 'datetime' },
  { key: 'total_msg_count', label: 'Total Message Count', format: 'number' },
  { key: 'extra_update_at', label: 'Extra Updated At', format: 'datetime' },
  { key: 'creator_id', label: 'Creator ID' },
  { key: 'scheme_id', label: 'Scheme ID' },
  { key: 'props', label: 'Props' },
  { key: 'group_constrained', label: 'Group Constrained', format: 'boolean' },
  { key: 'autotranslation', label: 'Autotranslation', format: 'boolean' },
  { key: 'shared', label: 'Shared', format: 'boolean' },
  { key: 'total_msg_count_root', label: 'Total Root Message Count', format: 'number' },
  { key: 'policy_id', label: 'Policy ID' },
  { key: 'last_root_post_at', label: 'Last Root Post At', format: 'datetime' },
  { key: 'banner_info', label: 'Banner Info' },
  { key: 'policy_enforced', label: 'Policy Enforced', format: 'boolean' },
  { key: 'policy_auto_add', label: 'Policy Auto Add', format: 'boolean' },
  { key: 'policy_is_active', label: 'Policy Is Active', format: 'boolean' },
  { key: 'default_category_name', label: 'Default Category Name' },
  { key: 'managed_category_name', label: 'Managed Category Name' },
  { key: 'discoverable', label: 'Discoverable', format: 'boolean' },
  { key: 'disable_join_leave_messages', label: 'Join And Leave Messages Disabled', format: 'boolean' },
];

const channelWithTeamFields: OutputSchema['fields'] = [
  ...channelFields,
  { key: 'team_display_name', label: 'Team Display Name' },
  { key: 'team_name', label: 'Team Name' },
  { key: 'team_update_at', label: 'Team Updated At', format: 'datetime' },
];

const channelMemberNotifyPropsFields: OutputSchema['fields'] = [
  { key: 'channel_auto_follow_threads', label: 'Auto Follow Threads' },
  { key: 'desktop', label: 'Desktop Notifications' },
  { key: 'email', label: 'Email Notifications' },
  { key: 'ignore_channel_mentions', label: 'Ignore Channel Mentions' },
  { key: 'mark_unread', label: 'Mark Unread' },
  { key: 'push', label: 'Push Notifications' },
];

const channelMemberFields: OutputSchema['fields'] = [
  { key: 'channel_id', label: 'Channel ID' },
  { key: 'user_id', label: 'User ID' },
  { key: 'roles', label: 'Roles' },
  { key: 'msg_count', label: 'Message Count', format: 'number' },
  { key: 'mention_count', label: 'Mention Count', format: 'number' },
  { key: 'mention_count_root', label: 'Root Mention Count', format: 'number' },
  { key: 'urgent_mention_count', label: 'Urgent Mention Count', format: 'number' },
  { key: 'msg_count_root', label: 'Root Message Count', format: 'number' },
  { key: 'notify_props', label: 'Notification Settings', children: channelMemberNotifyPropsFields },
  { key: 'scheme_guest', label: 'Guest', format: 'boolean' },
  { key: 'scheme_user', label: 'Regular User', format: 'boolean' },
  { key: 'scheme_admin', label: 'Admin', format: 'boolean' },
  { key: 'explicit_roles', label: 'Explicit Roles' },
  { key: 'autotranslation_disabled', label: 'Autotranslation Disabled', format: 'boolean' },
];

const channelMemberActivityFields: OutputSchema['fields'] = [
  ...channelMemberFields,
  { key: 'last_viewed_at', label: 'Last Viewed At', format: 'datetime' },
  { key: 'last_update_at', label: 'Last Updated At', format: 'datetime' },
];

const userChannelMembershipFields: OutputSchema['fields'] = [
  ...channelMemberActivityFields,
  { key: 'team_display_name', label: 'Team Display Name' },
  { key: 'team_name', label: 'Team Name' },
  { key: 'team_update_at', label: 'Team Updated At', format: 'datetime' },
];

const channelUnreadFields: OutputSchema['fields'] = [
  { key: 'team_id', label: 'Team ID' },
  { key: 'channel_id', label: 'Channel ID' },
  { key: 'msg_count', label: 'Message Count', format: 'number' },
  { key: 'mention_count', label: 'Mention Count', format: 'number' },
  { key: 'mention_count_root', label: 'Root Mention Count', format: 'number' },
  { key: 'urgent_mention_count', label: 'Urgent Mention Count', format: 'number' },
  { key: 'msg_count_root', label: 'Root Message Count', format: 'number' },
];

const teamUnreadFields: OutputSchema['fields'] = [
  { key: 'team_id', label: 'Team ID' },
  { key: 'msg_count', label: 'Message Count', format: 'number' },
  { key: 'mention_count', label: 'Mention Count', format: 'number' },
  { key: 'mention_count_root', label: 'Root Mention Count', format: 'number' },
  { key: 'msg_count_root', label: 'Root Message Count', format: 'number' },
  { key: 'thread_count', label: 'Thread Count', format: 'number' },
  { key: 'thread_mention_count', label: 'Thread Mention Count', format: 'number' },
  { key: 'thread_urgent_mention_count', label: 'Thread Urgent Mention Count', format: 'number' },
];

const teamFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Team ID' },
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'type', label: 'Type' },
  { key: 'company_name', label: 'Company Name' },
  { key: 'allowed_domains', label: 'Allowed Domains' },
  { key: 'invite_id', label: 'Invite ID' },
  { key: 'allow_open_invite', label: 'Open Invite Allowed', format: 'boolean' },
  { key: 'scheme_id', label: 'Scheme ID' },
  { key: 'group_constrained', label: 'Group Constrained', format: 'boolean' },
  { key: 'policy_id', label: 'Policy ID' },
  { key: 'cloud_limits_archived', label: 'Archived By Cloud Limits', format: 'boolean' },
  { key: 'policy_enforced', label: 'Policy Enforced', format: 'boolean' },
  { key: 'policy_auto_add', label: 'Policy Auto Add', format: 'boolean' },
  { key: 'policy_is_active', label: 'Policy Is Active', format: 'boolean' },
];

const teamIconUpdatedField: OutputSchema['fields'][number] = {
  key: 'last_team_icon_update',
  label: 'Icon Last Updated',
  format: 'datetime',
};

const teamMemberFields: OutputSchema['fields'] = [
  { key: 'team_id', label: 'Team ID' },
  { key: 'user_id', label: 'User ID' },
  { key: 'roles', label: 'Roles' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'scheme_guest', label: 'Guest', format: 'boolean' },
  { key: 'scheme_user', label: 'Regular User', format: 'boolean' },
  { key: 'scheme_admin', label: 'Admin', format: 'boolean' },
  { key: 'explicit_roles', label: 'Explicit Roles' },
];

const fileInfoFields: OutputSchema['fields'] = [
  { key: 'id', label: 'File ID' },
  { key: 'user_id', label: 'User ID' },
  { key: 'channel_id', label: 'Channel ID' },
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'name', label: 'File Name' },
  { key: 'extension', label: 'Extension' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'mime_type', label: 'MIME Type' },
  { key: 'width', label: 'Width', format: 'number' },
  { key: 'height', label: 'Height', format: 'number' },
  { key: 'has_preview_image', label: 'Has Preview Image', format: 'boolean' },
  { key: 'mini_preview', label: 'Mini Preview' },
  { key: 'remote_id', label: 'Remote ID' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
];

const postFileInfoFields: OutputSchema['fields'] = [
  ...fileInfoFields,
  { key: 'post_id', label: 'Post ID' },
];

const systemMessagePropsFields: OutputSchema['fields'] = [
  { key: 'username', label: 'Username' },
  { key: 'addedUserId', label: 'Added User ID' },
  { key: 'addedUsername', label: 'Added Username' },
  { key: 'userId', label: 'User ID' },
  { key: 'new_purpose', label: 'New Purpose' },
  { key: 'old_purpose', label: 'Old Purpose' },
  { key: 'new_header', label: 'New Header' },
  { key: 'old_header', label: 'Old Header' },
];

const postCoreFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Post ID' },
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'edit_at', label: 'Edited At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'is_pinned', label: 'Pinned', format: 'boolean' },
  { key: 'user_id', label: 'User ID' },
  { key: 'channel_id', label: 'Channel ID' },
  { key: 'root_id', label: 'Root Post ID' },
  { key: 'original_id', label: 'Original Post ID' },
  { key: 'message', label: 'Message' },
  { key: 'type', label: 'Type' },
  { key: 'hashtags', label: 'Hashtags' },
  { key: 'file_ids', label: 'File IDs' },
  { key: 'pending_post_id', label: 'Pending Post ID' },
  { key: 'reply_count', label: 'Reply Count', format: 'number' },
  { key: 'last_reply_at', label: 'Last Reply At', format: 'datetime' },
  { key: 'participants', label: 'Participants' },
];

const remoteIdField: OutputSchema['fields'][number] = { key: 'remote_id', label: 'Remote ID' };

const hasReactionsField: OutputSchema['fields'][number] = {
  key: 'has_reactions',
  label: 'Has Reactions',
  format: 'boolean',
};

const postFields: OutputSchema['fields'] = [
  ...postCoreFields,
  { key: 'props', label: 'Props' },
  { key: 'metadata', label: 'Metadata' },
];

const postWithRemoteFields: OutputSchema['fields'] = [...postFields, remoteIdField];

const channelPostFields: OutputSchema['fields'] = [
  ...postCoreFields,
  { key: 'props', label: 'Props', children: systemMessagePropsFields },
  remoteIdField,
  {
    key: 'metadata',
    label: 'Metadata',
    children: [{ key: 'files', label: 'Files', labelKey: 'name', listItems: postFileInfoFields }],
  },
];

const threadPostFields: OutputSchema['fields'] = [...postCoreFields, { key: 'props', label: 'Props' }];

const postListFields: OutputSchema['fields'] = [
  { key: 'order', label: 'Post Order' },
  { key: 'next_post_id', label: 'Next Post ID' },
  { key: 'prev_post_id', label: 'Previous Post ID' },
  { key: 'first_inaccessible_post_time', label: 'First Inaccessible Post Time', format: 'datetime' },
];

const threadFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Thread ID' },
  { key: 'reply_count', label: 'Reply Count', format: 'number' },
  { key: 'last_reply_at', label: 'Last Reply At', format: 'datetime' },
  { key: 'last_viewed_at', label: 'Last Viewed At', format: 'datetime' },
  { key: 'participants', label: 'Participants', labelKey: 'username', listItems: threadParticipantFields },
  { key: 'unread_replies', label: 'Unread Replies', format: 'number' },
  { key: 'unread_mentions', label: 'Unread Mentions', format: 'number' },
  { key: 'is_urgent', label: 'Urgent', format: 'boolean' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
];

function postListWith({ postFieldList }: { postFieldList: OutputSchema['fields'] }): OutputSchema['fields'] {
  return [
    ...postListFields,
    { key: 'posts', label: 'Posts', dynamicKey: true, labelKey: 'message', children: postFieldList },
  ];
}

function threadWith({ postFieldList }: { postFieldList: OutputSchema['fields'] }): OutputSchema['fields'] {
  return [...threadFields, { key: 'post', label: 'Root Post', children: postFieldList }];
}

const reactionFields: OutputSchema['fields'] = [
  { key: 'user_id', label: 'User ID' },
  { key: 'post_id', label: 'Post ID' },
  { key: 'emoji_name', label: 'Emoji Name' },
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'remote_id', label: 'Remote ID' },
  { key: 'channel_id', label: 'Channel ID' },
];

const botFields: OutputSchema['fields'] = [
  { key: 'user_id', label: 'Bot User ID' },
  { key: 'username', label: 'Username' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'description', label: 'Description' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'system_owned', label: 'System Owned', format: 'boolean' },
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
];

const commandFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Command ID' },
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'creator_id', label: 'Creator ID' },
  { key: 'team_id', label: 'Team ID' },
  { key: 'trigger', label: 'Trigger Word' },
  { key: 'method', label: 'HTTP Method' },
  { key: 'username', label: 'Username' },
  { key: 'icon_url', label: 'Icon URL', format: 'image' },
  { key: 'auto_complete', label: 'Autocomplete', format: 'boolean' },
  { key: 'auto_complete_desc', label: 'Autocomplete Description' },
  { key: 'auto_complete_hint', label: 'Autocomplete Hint' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'description', label: 'Description' },
  { key: 'url', label: 'Request URL', format: 'url' },
  { key: 'plugin_id', label: 'Plugin ID' },
];

const emojiFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Emoji ID' },
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'creator_id', label: 'Creator ID' },
  { key: 'name', label: 'Name' },
];

const channelCategoryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Category ID' },
  { key: 'user_id', label: 'User ID' },
  { key: 'team_id', label: 'Team ID' },
  { key: 'sort_order', label: 'Sort Order', format: 'number' },
  { key: 'sorting', label: 'Sorting' },
  { key: 'type', label: 'Type' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'muted', label: 'Muted', format: 'boolean' },
  { key: 'collapsed', label: 'Collapsed', format: 'boolean' },
  { key: 'channel_ids', label: 'Channel IDs' },
];

const userStatusFields: OutputSchema['fields'] = [
  { key: 'user_id', label: 'User ID' },
  { key: 'status', label: 'Status' },
  { key: 'manual', label: 'Set Manually', format: 'boolean' },
  { key: 'last_activity_at', label: 'Last Activity At', format: 'datetime' },
  { key: 'dnd_end_time', label: 'Do Not Disturb Ends At', format: 'number' },
];

const preferenceFields: OutputSchema['fields'] = [
  { key: 'user_id', label: 'User ID' },
  { key: 'category', label: 'Category' },
  { key: 'name', label: 'Name' },
  { key: 'value', label: 'Value' },
];

const roleFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Role ID' },
  { key: 'name', label: 'Name' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'description', label: 'Description' },
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'scheme_managed', label: 'Scheme Managed', format: 'boolean' },
  { key: 'built_in', label: 'Built In', format: 'boolean' },
  { key: 'scheme_id', label: 'Scheme ID' },
];

const draftFields: OutputSchema['fields'] = [
  { key: 'create_at', label: 'Created At', format: 'datetime' },
  { key: 'update_at', label: 'Updated At', format: 'datetime' },
  { key: 'delete_at', label: 'Deleted At', format: 'datetime' },
  { key: 'user_id', label: 'User ID' },
  { key: 'channel_id', label: 'Channel ID' },
  { key: 'root_id', label: 'Root Post ID' },
  { key: 'message', label: 'Message' },
  { key: 'type', label: 'Type' },
  { key: 'props', label: 'Props' },
  { key: 'metadata', label: 'Metadata' },
];

export const mattermostAddChannelMemberOutputSchema: OutputSchema = { fields: channelMemberFields };

export const mattermostAddReactionOutputSchema: OutputSchema = { fields: reactionFields };

export const mattermostAddTeamMemberOutputSchema: OutputSchema = { fields: teamMemberFields };

export const mattermostAddTeamMembersOutputSchema: OutputSchema = {
  fields: [
    { key: 'members', label: 'Members', labelKey: 'user_id', listItems: teamMemberFields },
    countField,
  ],
};

export const mattermostArchiveChannelOutputSchema: OutputSchema = {
  fields: [{ key: 'status', label: 'Status' }],
};

export const mattermostAssignBotOutputSchema: OutputSchema = { fields: botFields };

export const mattermostCheckTeamExistsOutputSchema: OutputSchema = {
  fields: [{ key: 'exists', label: 'Exists', format: 'boolean' }],
};

export const mattermostConvertBotToUserOutputSchema: OutputSchema = {
  fields: [
    ...userCoreFields,
    passwordUpdatedField,
    { key: 'is_bot', label: 'Is Bot', format: 'boolean' },
    { key: 'bot_description', label: 'Bot Description' },
  ],
};

export const mattermostConvertGroupMessageToChannelOutputSchema: OutputSchema = {
  fields: channelFields,
};

export const mattermostConvertUserToBotOutputSchema: OutputSchema = {
  fields: botFields.filter((field) => field.key !== 'description'),
};

export const mattermostCountUserReportsOutputSchema: OutputSchema = { fields: [countField] };

export const mattermostCreateChannelOutputSchema: OutputSchema = { fields: channelFields };

export const mattermostCreateChannelCategoryOutputSchema: OutputSchema = {
  fields: channelCategoryFields,
};

export const mattermostCreateCommandOutputSchema: OutputSchema = { fields: commandFields };

export const mattermostCreateEmojiOutputSchema: OutputSchema = { fields: emojiFields };

export const mattermostCreatePostOutputSchema: OutputSchema = { fields: postWithRemoteFields };

export const mattermostCreateTeamOutputSchema: OutputSchema = { fields: teamFields };

export const mattermostCreateUserOutputSchema: OutputSchema = {
  fields: [...userFields, passwordUpdatedField],
};

export const mattermostDisableBotOutputSchema: OutputSchema = { fields: botFields };

export const mattermostDownloadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'fileName', label: 'File Name' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'size', label: 'Size', format: 'filesize' },
  ],
};

export const mattermostExecuteCommandOutputSchema: OutputSchema = {
  fields: [
    { key: 'response_type', label: 'Response Type' },
    { key: 'text', label: 'Text' },
    { key: 'username', label: 'Username' },
    { key: 'channel_id', label: 'Channel ID' },
    { key: 'icon_url', label: 'Icon URL', format: 'image' },
    { key: 'type', label: 'Type' },
    { key: 'props', label: 'Props' },
    { key: 'goto_location', label: 'Go To Location' },
    { key: 'trigger_id', label: 'Trigger ID' },
    { key: 'skip_slack_parsing', label: 'Skip Slack Parsing', format: 'boolean' },
    { key: 'attachments', label: 'Attachments' },
    { key: 'extra_responses', label: 'Extra Responses' },
  ],
};

export const mattermostGetChannelCategoryOrderOutputSchema: OutputSchema = {
  fields: [{ key: 'order', label: 'Category Order' }, countField],
};

export const mattermostGetChannelMemberCountsOutputSchema: OutputSchema = {
  fields: [{ key: 'counts', label: 'Member Counts By Channel', value: '', dynamicKey: true }],
};

export const mattermostGetChannelMembersByIdsOutputSchema: OutputSchema = {
  fields: [
    { key: 'members', label: 'Members', labelKey: 'user_id', listItems: channelMemberFields },
    countField,
  ],
};

export const mattermostGetChannelStatsOutputSchema: OutputSchema = {
  fields: [
    { key: 'channel_id', label: 'Channel ID' },
    { key: 'member_count', label: 'Member Count', format: 'number' },
    { key: 'guest_count', label: 'Guest Count', format: 'number' },
    { key: 'pinnedpost_count', label: 'Pinned Post Count', format: 'number' },
    { key: 'files_count', label: 'File Count', format: 'number' },
  ],
};

export const mattermostGetChannelUnreadOutputSchema: OutputSchema = { fields: channelUnreadFields };

export const mattermostGetChannelsByIdsOutputSchema: OutputSchema = {
  fields: [
    { key: 'channels', label: 'Channels', labelKey: 'name', listItems: channelFields },
    countField,
  ],
};

export const mattermostGetEmojisByNamesOutputSchema: OutputSchema = {
  fields: [
    { key: 'emojis', label: 'Emojis', labelKey: 'name', listItems: emojiFields },
    countField,
  ],
};

export const mattermostGetFileInfoOutputSchema: OutputSchema = { fields: fileInfoFields };

export const mattermostGetFilePublicLinkOutputSchema: OutputSchema = {
  fields: [{ key: 'link', label: 'Public Link', format: 'url' }],
};

export const mattermostGetFilteredUserStatsOutputSchema: OutputSchema = {
  fields: [{ key: 'total_users_count', label: 'Total Users', format: 'number' }],
};

export const mattermostGetPostEditHistoryOutputSchema: OutputSchema = {
  fields: [
    { key: 'versions', label: 'Versions', labelKey: 'message', listItems: postWithRemoteFields },
    countField,
  ],
};

export const mattermostGetPostInfoOutputSchema: OutputSchema = {
  fields: [
    { key: 'channel_id', label: 'Channel ID' },
    { key: 'channel_type', label: 'Channel Type' },
    { key: 'channel_display_name', label: 'Channel Display Name' },
    { key: 'has_joined_channel', label: 'Has Joined Channel', format: 'boolean' },
    { key: 'team_id', label: 'Team ID' },
    { key: 'team_type', label: 'Team Type' },
    { key: 'team_display_name', label: 'Team Display Name' },
    { key: 'has_joined_team', label: 'Has Joined Team', format: 'boolean' },
  ],
};

export const mattermostGetPostThreadOutputSchema: OutputSchema = {
  fields: [
    ...postListWith({ postFieldList: postFields }),
    { key: 'has_next', label: 'Has Next', format: 'boolean' },
  ],
};

export const mattermostGetPostsByIdsOutputSchema: OutputSchema = {
  fields: [
    { key: 'posts', label: 'Posts', labelKey: 'message', listItems: postFields },
    countField,
  ],
};

export const mattermostGetPreferenceOutputSchema: OutputSchema = { fields: preferenceFields };

export const mattermostGetRoleOutputSchema: OutputSchema = { fields: roleFields };

export const mattermostGetRolesByNamesOutputSchema: OutputSchema = {
  fields: [
    { key: 'roles', label: 'Roles', labelKey: 'name', listItems: roleFields },
    countField,
  ],
};

export const mattermostGetServerLimitsOutputSchema: OutputSchema = {
  fields: [
    { key: 'maxUsersLimit', label: 'Max Users Limit', format: 'number' },
    { key: 'maxUsersHardLimit', label: 'Max Users Hard Limit', format: 'number' },
    { key: 'activeUserCount', label: 'Active User Count', format: 'number' },
    { key: 'singleChannelGuestCount', label: 'Single Channel Guest Count', format: 'number' },
    { key: 'singleChannelGuestLimit', label: 'Single Channel Guest Limit', format: 'number' },
    { key: 'postHistoryLimit', label: 'Post History Limit', format: 'number' },
    { key: 'lastAccessiblePostTime', label: 'Last Accessible Post Time', format: 'datetime' },
  ],
};

export const mattermostGetTeamOutputSchema: OutputSchema = {
  fields: [...teamFields, teamIconUpdatedField],
};

export const mattermostGetTeamInviteInfoOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Team ID' },
    { key: 'name', label: 'Name' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'description', label: 'Description' },
  ],
};

export const mattermostGetTeamStatsOutputSchema: OutputSchema = {
  fields: [
    { key: 'team_id', label: 'Team ID' },
    { key: 'total_member_count', label: 'Total Member Count', format: 'number' },
    { key: 'active_member_count', label: 'Active Member Count', format: 'number' },
  ],
};

export const mattermostGetTeamUnreadOutputSchema: OutputSchema = { fields: teamUnreadFields };

export const mattermostGetThreadOutputSchema: OutputSchema = {
  fields: threadWith({ postFieldList: [...threadPostFields, hasReactionsField] }),
};

export const mattermostGetUserOutputSchema: OutputSchema = {
  fields: [...userFields, pictureUpdatedField],
};

export const mattermostGetUserByEmailOutputSchema: OutputSchema = { fields: userFields };

export const mattermostGetUserStatusOutputSchema: OutputSchema = { fields: userStatusFields };

export const mattermostGetUserStatusesOutputSchema: OutputSchema = {
  fields: [
    { key: 'statuses', label: 'Statuses', labelKey: 'status', listItems: userStatusFields },
    countField,
  ],
};

export const mattermostGetUsersByIdsOutputSchema: OutputSchema = {
  fields: [
    { key: 'users', label: 'Users', labelKey: 'username', listItems: userFields },
    countField,
  ],
};

export const mattermostListAllChannelsOutputSchema: OutputSchema = {
  fields: [
    { key: 'channels', label: 'Channels', labelKey: 'name', listItems: channelWithTeamFields },
    countField,
  ],
};

export const mattermostListArchivedChannelsOutputSchema: OutputSchema = {
  fields: [
    { key: 'channels', label: 'Channels', labelKey: 'name', listItems: channelFields },
    countField,
  ],
};

export const mattermostListBotsOutputSchema: OutputSchema = {
  fields: [
    { key: 'bots', label: 'Bots', labelKey: 'display_name', listItems: botFields },
    countField,
  ],
};

export const mattermostListChannelCategoriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'categories',
      label: 'Categories',
      labelKey: 'display_name',
      listItems: channelCategoryFields,
    },
    { key: 'order', label: 'Category Order' },
  ],
};

export const mattermostListChannelMembersOutputSchema: OutputSchema = {
  fields: [
    { key: 'members', label: 'Members', labelKey: 'user_id', listItems: channelMemberActivityFields },
    countField,
  ],
};

export const mattermostListChannelPostsOutputSchema: OutputSchema = {
  fields: postListWith({ postFieldList: channelPostFields }),
};

export const mattermostListChannelTimezonesOutputSchema: OutputSchema = {
  fields: [{ key: 'timezones', label: 'Timezones' }, countField],
};

export const mattermostListCommandsOutputSchema: OutputSchema = {
  fields: [
    { key: 'commands', label: 'Commands', labelKey: 'display_name', listItems: commandFields },
    countField,
  ],
};

export const mattermostListDraftsOutputSchema: OutputSchema = {
  fields: [
    { key: 'drafts', label: 'Drafts', labelKey: 'message', listItems: draftFields },
    countField,
  ],
};

export const mattermostListFlaggedPostsOutputSchema: OutputSchema = {
  fields: postListWith({ postFieldList: postFields }),
};

export const mattermostListGroupChannelCommonTeamsOutputSchema: OutputSchema = {
  fields: [
    { key: 'teams', label: 'Teams', labelKey: 'name', listItems: teamFields },
    countField,
  ],
};

export const mattermostListGroupChannelUsersOutputSchema: OutputSchema = {
  fields: [{ key: 'users', label: 'Users By ID', value: '', dynamicKey: true }],
};

export const mattermostListKnownUsersOutputSchema: OutputSchema = {
  fields: [{ key: 'userIds', label: 'User IDs' }, countField],
};

export const mattermostListPostFilesOutputSchema: OutputSchema = {
  fields: [
    { key: 'files', label: 'Files', labelKey: 'name', listItems: postFileInfoFields },
    countField,
  ],
};

export const mattermostListPreferencesOutputSchema: OutputSchema = {
  fields: [
    { key: 'preferences', label: 'Preferences', labelKey: 'name', listItems: preferenceFields },
    countField,
  ],
};

export const mattermostListReactionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'reactions', label: 'Reactions', labelKey: 'emoji_name', listItems: reactionFields },
    countField,
  ],
};

export const mattermostListTeamUnreadsOutputSchema: OutputSchema = {
  fields: [
    { key: 'unreads', label: 'Unreads', labelKey: 'team_id', listItems: teamUnreadFields },
    countField,
  ],
};

export const mattermostListThreadsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'total_unread_threads', label: 'Total Unread Threads', format: 'number' },
    { key: 'total_unread_mentions', label: 'Total Unread Mentions', format: 'number' },
    { key: 'total_unread_urgent_mentions', label: 'Total Unread Urgent Mentions', format: 'number' },
    {
      key: 'threads',
      label: 'Threads',
      labelKey: 'id',
      listItems: threadWith({ postFieldList: [...threadPostFields, hasReactionsField, remoteIdField] }),
    },
  ],
};

export const mattermostListUserChannelMembershipsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'channelMembers',
      label: 'Channel Memberships',
      labelKey: 'channel_id',
      listItems: userChannelMembershipFields,
    },
    countField,
  ],
};

export const mattermostListUserReportsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'users',
      label: 'Users',
      labelKey: 'username',
      listItems: [
        ...userFields,
        pictureUpdatedField,
        { key: 'last_login', label: 'Last Login', format: 'datetime' },
        { key: 'last_status_at', label: 'Last Status At', format: 'datetime' },
        { key: 'days_active', label: 'Days Active', format: 'number' },
        { key: 'channel_count', label: 'Channel Count', format: 'number' },
        { key: 'teams', label: 'Teams' },
      ],
    },
    countField,
  ],
};

export const mattermostListUserTeamMembershipsOutputSchema: OutputSchema = {
  fields: [
    { key: 'memberships', label: 'Team Memberships', labelKey: 'team_id', listItems: teamMemberFields },
    countField,
  ],
};

export const mattermostMarkChannelsReadOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    {
      key: 'last_viewed_at_times',
      label: 'Last Viewed At By Channel',
      dynamicKey: true,
      format: 'datetime',
    },
  ],
};

export const mattermostMarkPostUnreadOutputSchema: OutputSchema = {
  fields: [
    ...channelUnreadFields,
    { key: 'user_id', label: 'User ID' },
    { key: 'last_viewed_at', label: 'Last Viewed At', format: 'datetime' },
  ],
};

export const mattermostMarkThreadReadOutputSchema: OutputSchema = {
  fields: threadWith({ postFieldList: threadPostFields }),
};

export const mattermostPatchPostOutputSchema: OutputSchema = { fields: postFields };

export const mattermostSearchAllChannelsOutputSchema: OutputSchema = {
  fields: [
    { key: 'channels', label: 'Channels', labelKey: 'name', listItems: channelWithTeamFields },
    { key: 'total_count', label: 'Total Count', format: 'number' },
  ],
};

export const mattermostSearchFilesOutputSchema: OutputSchema = {
  fields: [
    { key: 'order', label: 'File Order' },
    {
      key: 'file_infos',
      label: 'Files',
      dynamicKey: true,
      labelKey: 'name',
      children: postFileInfoFields,
    },
    { key: 'next_file_info_id', label: 'Next File ID' },
    { key: 'prev_file_info_id', label: 'Previous File ID' },
    { key: 'first_inaccessible_file_time', label: 'First Inaccessible File Time', format: 'datetime' },
  ],
};

export const mattermostSearchPostsOutputSchema: OutputSchema = {
  fields: [
    ...postListWith({ postFieldList: postWithRemoteFields }),
    { key: 'matches', label: 'Matches' },
  ],
};

export const mattermostSearchTeamsOutputSchema: OutputSchema = {
  fields: [
    { key: 'teams', label: 'Teams', labelKey: 'name', listItems: teamFields },
    { key: 'total_count', label: 'Total Count', format: 'number' },
  ],
};

export const mattermostSetChannelMembersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'batches',
      label: 'Batches',
      listItems: [
        { key: 'added', label: 'Added' },
        { key: 'removed', label: 'Removed' },
      ],
    },
    countField,
  ],
};

export const mattermostUpdateChannelCategoriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'categories',
      label: 'Categories',
      labelKey: 'display_name',
      listItems: channelCategoryFields,
    },
    countField,
  ],
};

export const mattermostUpdateTeamPrivacyOutputSchema: OutputSchema = {
  fields: [...teamFields, teamIconUpdatedField],
};

export const mattermostUploadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file_infos', label: 'Files', labelKey: 'name', listItems: fileInfoFields },
    { key: 'client_ids', label: 'Client IDs' },
  ],
};

export const mattermostUpsertDraftOutputSchema: OutputSchema = { fields: draftFields };

export const mattermostSendMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'HTTP Status', format: 'number' },
    { key: 'body', label: 'Post', children: postWithRemoteFields },
  ],
};
