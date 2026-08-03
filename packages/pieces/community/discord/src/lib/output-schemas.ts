import { OutputSchema } from '@activepieces/pieces-framework';

const discordMessageAuthorFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'username', label: 'Username' },
  { key: 'global_name', label: 'Display Name' },
  { key: 'bot', label: 'Is Bot', format: 'boolean' },
];

const discordMessageAttachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'filename', label: 'File Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'content_type', label: 'Content Type' },
];

export const discordMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Message ID' },
    { key: 'channel_id', label: 'Channel ID' },
    { key: 'content', label: 'Content' },
    { key: 'timestamp', label: 'Sent At', format: 'datetime' },
    { key: 'edited_timestamp', label: 'Edited At', format: 'datetime' },
    { key: 'pinned', label: 'Pinned', format: 'boolean' },
    { key: 'tts', label: 'Text To Speech', format: 'boolean' },
    { key: 'mention_everyone', label: 'Mentions Everyone', format: 'boolean' },
    { key: 'author', label: 'Author', children: discordMessageAuthorFields },
    {
      key: 'attachments',
      label: 'Attachments',
      labelKey: 'filename',
      listItems: discordMessageAttachmentFields,
    },
  ],
};

const discordMemberUserFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'username', label: 'Username' },
  { key: 'global_name', label: 'Display Name' },
  { key: 'avatar', label: 'Avatar Hash' },
];

export const discordNewMemberTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'user', label: 'User', children: discordMemberUserFields },
    { key: 'nick', label: 'Nickname' },
    { key: 'joined_at', label: 'Joined At', format: 'datetime' },
    { key: 'roles', label: 'Role IDs' },
  ],
};

export const discordCreateChannelActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'channel',
      label: 'Channel',
      children: [
        { key: 'id', label: 'Channel ID' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

export const discordRoleActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'role',
      label: 'Role',
      children: [
        { key: 'id', label: 'Role ID' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

export const discordSuccessActionOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const discordSuccessWithAlreadyAbsentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'alreadyAbsent', label: 'Already Absent', format: 'boolean' },
  ],
};

export const discordListReactionsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'users',
      label: 'Users',
      labelKey: 'username',
      listItems: [
        { key: 'user_id', label: 'User ID' },
        { key: 'username', label: 'Username' },
        { key: 'global_name', label: 'Display Name' },
      ],
    },
  ],
};

export const discordListActiveThreadsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'threads',
      label: 'Threads',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Thread ID' },
        { key: 'name', label: 'Name' },
        { key: 'parent_id', label: 'Parent Channel ID' },
        { key: 'owner_id', label: 'Owner ID' },
        { key: 'archived', label: 'Archived', format: 'boolean' },
      ],
    },
  ],
};

export const discordListArchivedThreadsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'threads',
      label: 'Threads',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Thread ID' },
        { key: 'name', label: 'Name' },
        { key: 'parent_id', label: 'Parent Channel ID' },
        { key: 'owner_id', label: 'Owner ID' },
        { key: 'archive_timestamp', label: 'Archived At', format: 'datetime' },
      ],
    },
  ],
};

export const discordBulkDeleteMessagesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'deleted_count', label: 'Deleted Count', format: 'number' },
  ],
};

export const discordListChannelsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'channels',
      label: 'Channels',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Channel ID' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type', format: 'number' },
        { key: 'parent_id', label: 'Parent Category ID' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'topic', label: 'Topic' },
      ],
    },
  ],
};

export const discordSuccessWithChannelIdActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'channel_id', label: 'Channel ID' },
  ],
};

export const discordGetChannelActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Channel ID' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', format: 'number' },
    { key: 'guild_id', label: 'Guild ID' },
    { key: 'parent_id', label: 'Parent Category ID' },
    { key: 'topic', label: 'Topic' },
    { key: 'nsfw', label: 'NSFW', format: 'boolean' },
  ],
};

export const discordGetGuildActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Guild ID' },
    { key: 'name', label: 'Name' },
    { key: 'owner_id', label: 'Owner ID' },
    { key: 'description', label: 'Description' },
    { key: 'approximate_member_count', label: 'Approximate Member Count', format: 'number' },
    { key: 'approximate_presence_count', label: 'Approximate Presence Count', format: 'number' },
  ],
};

export const discordFindChannelActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'channel_id', label: 'Channel ID' },
    { key: 'name', label: 'Name' },
  ],
};

export const discordCreateThreadActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'thread',
      label: 'Thread',
      children: [
        { key: 'id', label: 'Thread ID' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

export const discordListMessagesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'messages',
      label: 'Messages',
      labelKey: 'content',
      listItems: [
        { key: 'id', label: 'Message ID' },
        { key: 'content', label: 'Content' },
        { key: 'author_id', label: 'Author ID' },
        { key: 'author_username', label: 'Author Username' },
        { key: 'pinned', label: 'Pinned', format: 'boolean' },
        { key: 'timestamp', label: 'Sent At', format: 'datetime' },
        { key: 'edited_timestamp', label: 'Edited At', format: 'datetime' },
      ],
    },
  ],
};

export const discordListPinnedMessagesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'messages',
      label: 'Messages',
      labelKey: 'content',
      listItems: [
        { key: 'id', label: 'Message ID' },
        { key: 'content', label: 'Content' },
        { key: 'author_id', label: 'Author ID' },
        { key: 'author_username', label: 'Author Username' },
        { key: 'timestamp', label: 'Sent At', format: 'datetime' },
      ],
    },
  ],
};

export const discordEditMessageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Message ID' },
    { key: 'content', label: 'Content' },
    { key: 'edited_timestamp', label: 'Edited At', format: 'datetime' },
  ],
};

export const discordSendApprovalMessageActionOutputSchema: OutputSchema = {
  fields: [{ key: 'approved', label: 'Approved', format: 'boolean' }],
};

export const discordCreateScheduledEventActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'event',
      label: 'Event',
      children: [
        { key: 'id', label: 'Event ID' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

export const discordListGuildMembersActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'options',
      label: 'Members',
      labelKey: 'label',
      listItems: [
        { key: 'value', label: 'User ID' },
        { key: 'label', label: 'Username' },
      ],
    },
  ],
};

export const discordFindMemberActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'members',
      label: 'Members',
      labelKey: 'username',
      listItems: [
        { key: 'user_id', label: 'User ID' },
        { key: 'username', label: 'Username' },
        { key: 'global_name', label: 'Display Name' },
        { key: 'nick', label: 'Nickname' },
        { key: 'joined_at', label: 'Joined At', format: 'datetime' },
        { key: 'roles', label: 'Role IDs' },
      ],
    },
  ],
};

export const discordGetMemberActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'user_id', label: 'User ID' },
    { key: 'username', label: 'Username' },
    { key: 'global_name', label: 'Display Name' },
    { key: 'nick', label: 'Nickname' },
    { key: 'roles', label: 'Role IDs' },
    { key: 'joined_at', label: 'Joined At', format: 'datetime' },
    { key: 'communication_disabled_until', label: 'Timed Out Until', format: 'datetime' },
  ],
};

export const discordGetUserActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID' },
    { key: 'username', label: 'Username' },
    { key: 'global_name', label: 'Display Name' },
    { key: 'bot', label: 'Is Bot', format: 'boolean' },
    { key: 'avatar', label: 'Avatar Hash' },
  ],
};

export const discordRevokeInviteActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'code', label: 'Invite Code' },
  ],
};

export const discordUpdateScheduledEventActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'event',
      label: 'Event',
      children: [
        { key: 'id', label: 'Event ID' },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status', format: 'number' },
      ],
    },
  ],
};

export const discordListScheduledEventsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'events',
      label: 'Events',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Event ID' },
        { key: 'name', label: 'Name' },
        { key: 'scheduled_start_time', label: 'Start Time', format: 'datetime' },
        { key: 'scheduled_end_time', label: 'End Time', format: 'datetime' },
        { key: 'status', label: 'Status', format: 'number' },
        { key: 'entity_type', label: 'Entity Type', format: 'number' },
        { key: 'user_count', label: 'User Count', format: 'number' },
      ],
    },
  ],
};

export const discordListBansActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'bans',
      label: 'Bans',
      labelKey: 'username',
      listItems: [
        { key: 'user_id', label: 'User ID' },
        { key: 'username', label: 'Username' },
        { key: 'reason', label: 'Reason' },
      ],
    },
  ],
};

export const discordListEmojisActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'emojis',
      label: 'Emojis',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Emoji ID' },
        { key: 'name', label: 'Name' },
        { key: 'animated', label: 'Animated', format: 'boolean' },
        { key: 'reaction_string', label: 'Reaction String' },
      ],
    },
  ],
};

export const discordListInvitesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'invites',
      label: 'Invites',
      labelKey: 'code',
      listItems: [
        { key: 'code', label: 'Invite Code' },
        { key: 'uses', label: 'Uses', format: 'number' },
        { key: 'max_uses', label: 'Max Uses', format: 'number' },
        { key: 'channel_id', label: 'Channel ID' },
        { key: 'channel_name', label: 'Channel Name' },
        { key: 'inviter_id', label: 'Inviter ID' },
        { key: 'expires_at', label: 'Expires At', format: 'datetime' },
      ],
    },
  ],
};

export const discordListRolesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'roles',
      label: 'Roles',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Role ID' },
        { key: 'name', label: 'Name' },
        { key: 'color', label: 'Color', format: 'number' },
        { key: 'hoist', label: 'Display Separately', format: 'boolean' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'mentionable', label: 'Mentionable', format: 'boolean' },
      ],
    },
  ],
};
