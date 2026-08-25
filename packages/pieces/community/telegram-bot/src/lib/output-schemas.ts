import { OutputSchema } from '@activepieces/pieces-framework';

const telegramChatFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Chat ID', value: 'id' },
  { key: 'type', label: 'Chat Type', value: 'type' },
  { key: 'title', label: 'Title', value: 'title' },
];

const telegramFromFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Bot ID', value: 'id' },
  { key: 'username', label: 'Username', value: 'username' },
  { key: 'is_bot', label: 'Is Bot', value: 'is_bot', format: 'boolean' },
];

const telegramPhotoSizeFields: OutputSchema['fields'] = [
  { key: 'file_id', label: 'File ID', value: 'file_id' },
  { key: 'file_unique_id', label: 'File Unique ID', value: 'file_unique_id' },
  { key: 'width', label: 'Width', value: 'width', format: 'number' },
  { key: 'height', label: 'Height', value: 'height', format: 'number' },
  { key: 'file_size', label: 'File Size', value: 'file_size', format: 'filesize' },
];

const telegramVideoFields: OutputSchema['fields'] = [
  { key: 'file_id', label: 'File ID', value: 'file_id' },
  { key: 'file_unique_id', label: 'File Unique ID', value: 'file_unique_id' },
  { key: 'width', label: 'Width', value: 'width', format: 'number' },
  { key: 'height', label: 'Height', value: 'height', format: 'number' },
  { key: 'duration', label: 'Duration (s)', value: 'duration', format: 'number' },
  { key: 'file_name', label: 'File Name', value: 'file_name' },
  { key: 'mime_type', label: 'MIME Type', value: 'mime_type' },
  { key: 'file_size', label: 'File Size', value: 'file_size', format: 'filesize' },
];

const telegramAnimationFields: OutputSchema['fields'] = [
  { key: 'file_id', label: 'File ID', value: 'file_id' },
  { key: 'file_unique_id', label: 'File Unique ID', value: 'file_unique_id' },
  { key: 'width', label: 'Width', value: 'width', format: 'number' },
  { key: 'height', label: 'Height', value: 'height', format: 'number' },
  { key: 'duration', label: 'Duration (s)', value: 'duration', format: 'number' },
  { key: 'file_name', label: 'File Name', value: 'file_name' },
  { key: 'mime_type', label: 'MIME Type', value: 'mime_type' },
  { key: 'file_size', label: 'File Size', value: 'file_size', format: 'filesize' },
];

const telegramStickerFields: OutputSchema['fields'] = [
  { key: 'file_id', label: 'File ID', value: 'file_id' },
  { key: 'file_unique_id', label: 'File Unique ID', value: 'file_unique_id' },
  { key: 'width', label: 'Width', value: 'width', format: 'number' },
  { key: 'height', label: 'Height', value: 'height', format: 'number' },
  { key: 'emoji', label: 'Emoji', value: 'emoji' },
  { key: 'set_name', label: 'Sticker Set Name', value: 'set_name' },
  { key: 'file_size', label: 'File Size', value: 'file_size', format: 'filesize' },
];

const telegramAudioFields: OutputSchema['fields'] = [
  { key: 'file_id', label: 'File ID', value: 'file_id' },
  { key: 'file_unique_id', label: 'File Unique ID', value: 'file_unique_id' },
  { key: 'duration', label: 'Duration (s)', value: 'duration', format: 'number' },
  { key: 'performer', label: 'Performer', value: 'performer' },
  { key: 'title', label: 'Track Title', value: 'title' },
  { key: 'file_name', label: 'File Name', value: 'file_name' },
  { key: 'mime_type', label: 'MIME Type', value: 'mime_type' },
  { key: 'file_size', label: 'File Size', value: 'file_size', format: 'filesize' },
];

const telegramDocumentFields: OutputSchema['fields'] = [
  { key: 'file_id', label: 'File ID', value: 'file_id' },
  { key: 'file_unique_id', label: 'File Unique ID', value: 'file_unique_id' },
  { key: 'file_name', label: 'File Name', value: 'file_name' },
  { key: 'mime_type', label: 'MIME Type', value: 'mime_type' },
  { key: 'file_size', label: 'File Size', value: 'file_size', format: 'filesize' },
];

const telegramLocationFields: OutputSchema['fields'] = [
  { key: 'latitude', label: 'Latitude', value: 'latitude', format: 'number' },
  { key: 'longitude', label: 'Longitude', value: 'longitude', format: 'number' },
];

export const telegramSendMessageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'body.ok', format: 'boolean' },
    { key: 'message_id', label: 'Message ID', value: 'body.result.message_id' },
    { key: 'text', label: 'Message Text', value: 'body.result.text' },
    { key: 'date', label: 'Date', value: 'body.result.date', format: 'datetime' },
    { key: 'chat', label: 'Chat', value: 'body.result.chat', children: telegramChatFields },
    { key: 'from', label: 'From', value: 'body.result.from', children: telegramFromFields },
    { key: 'status', label: 'Status Code', value: 'status' },
  ],
};

export const telegramSendPhotoOrVideoActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'body.ok', format: 'boolean' },
    { key: 'message_id', label: 'Message ID', value: 'body.result.message_id' },
    { key: 'caption', label: 'Caption', value: 'body.result.caption' },
    { key: 'date', label: 'Date', value: 'body.result.date', format: 'datetime' },
    {
      key: 'photo',
      label: 'Photo Sizes',
      value: 'body.result.photo',
      listItems: telegramPhotoSizeFields,
    },
    { key: 'video', label: 'Video', value: 'body.result.video', children: telegramVideoFields },
    {
      key: 'sticker',
      label: 'Sticker',
      value: 'body.result.sticker',
      children: telegramStickerFields,
    },
    {
      key: 'animation',
      label: 'Animation',
      value: 'body.result.animation',
      children: telegramAnimationFields,
    },
    { key: 'chat', label: 'Chat', value: 'body.result.chat', children: telegramChatFields },
    { key: 'from', label: 'From', value: 'body.result.from', children: telegramFromFields },
    { key: 'status', label: 'Status Code', value: 'status' },
  ],
};

export const telegramSendAudioActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'body.ok', format: 'boolean' },
    { key: 'message_id', label: 'Message ID', value: 'body.result.message_id' },
    { key: 'caption', label: 'Caption', value: 'body.result.caption' },
    { key: 'date', label: 'Date', value: 'body.result.date', format: 'datetime' },
    { key: 'audio', label: 'Audio', value: 'body.result.audio', children: telegramAudioFields },
    { key: 'chat', label: 'Chat', value: 'body.result.chat', children: telegramChatFields },
    { key: 'from', label: 'From', value: 'body.result.from', children: telegramFromFields },
    { key: 'status', label: 'Status Code', value: 'status' },
  ],
};

export const telegramSendDocumentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'body.ok', format: 'boolean' },
    { key: 'message_id', label: 'Message ID', value: 'body.result.message_id' },
    { key: 'caption', label: 'Caption', value: 'body.result.caption' },
    { key: 'date', label: 'Date', value: 'body.result.date', format: 'datetime' },
    {
      key: 'document',
      label: 'Document',
      value: 'body.result.document',
      children: telegramDocumentFields,
    },
    { key: 'chat', label: 'Chat', value: 'body.result.chat', children: telegramChatFields },
    { key: 'from', label: 'From', value: 'body.result.from', children: telegramFromFields },
    { key: 'status', label: 'Status Code', value: 'status' },
  ],
};

export const telegramSendLocationActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'body.ok', format: 'boolean' },
    { key: 'message_id', label: 'Message ID', value: 'body.result.message_id' },
    { key: 'date', label: 'Date', value: 'body.result.date', format: 'datetime' },
    {
      key: 'location',
      label: 'Location',
      value: 'body.result.location',
      children: telegramLocationFields,
    },
    { key: 'chat', label: 'Chat', value: 'body.result.chat', children: telegramChatFields },
    { key: 'from', label: 'From', value: 'body.result.from', children: telegramFromFields },
    { key: 'status', label: 'Status Code', value: 'status' },
  ],
};

const telegramMediaGroupItemFields: OutputSchema['fields'] = [
  { key: 'message_id', label: 'Message ID', value: 'message_id' },
  { key: 'caption', label: 'Caption', value: 'caption' },
  { key: 'media_group_id', label: 'Media Group ID', value: 'media_group_id' },
  { key: 'photo', label: 'Photo Sizes', value: 'photo', listItems: telegramPhotoSizeFields },
  { key: 'video', label: 'Video', value: 'video', children: telegramVideoFields },
  { key: 'audio', label: 'Audio', value: 'audio', children: telegramAudioFields },
  { key: 'document', label: 'Document', value: 'document', children: telegramDocumentFields },
  { key: 'chat', label: 'Chat', value: 'chat', children: telegramChatFields },
  { key: 'from', label: 'From', value: 'from', children: telegramFromFields },
];

const telegramPollOptionFields: OutputSchema['fields'] = [
  { key: 'text', label: 'Text', value: 'text' },
  { key: 'voter_count', label: 'Voter Count', value: 'voter_count', format: 'number' },
];

const telegramPollFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Poll ID', value: 'id' },
  { key: 'question', label: 'Question', value: 'question' },
  {
    key: 'options',
    label: 'Options',
    value: 'options',
    labelKey: 'text',
    listItems: telegramPollOptionFields,
  },
  { key: 'total_voter_count', label: 'Total Voter Count', value: 'total_voter_count', format: 'number' },
  { key: 'is_closed', label: 'Is Closed', value: 'is_closed', format: 'boolean' },
  { key: 'is_anonymous', label: 'Is Anonymous', value: 'is_anonymous', format: 'boolean' },
  { key: 'type', label: 'Poll Type', value: 'type' },
  {
    key: 'allows_multiple_answers',
    label: 'Allows Multiple Answers',
    value: 'allows_multiple_answers',
    format: 'boolean',
  },
];

const telegramBooleanResultFields: OutputSchema['fields'] = [
  { key: 'ok', label: 'OK', value: 'body.ok', format: 'boolean' },
  { key: 'result', label: 'Result', value: 'body.result', format: 'boolean' },
  { key: 'status', label: 'Status Code', value: 'status' },
];

export const telegramSendMediaGroupActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'body.ok', format: 'boolean' },
    {
      key: 'result',
      label: 'Messages',
      value: 'body.result',
      listItems: telegramMediaGroupItemFields,
    },
    { key: 'status', label: 'Status Code', value: 'status' },
  ],
};

export const telegramSendPollActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'body.ok', format: 'boolean' },
    { key: 'message_id', label: 'Message ID', value: 'body.result.message_id' },
    { key: 'date', label: 'Date', value: 'body.result.date', format: 'datetime' },
    { key: 'poll', label: 'Poll', value: 'body.result.poll', children: telegramPollFields },
    { key: 'chat', label: 'Chat', value: 'body.result.chat', children: telegramChatFields },
    { key: 'from', label: 'From', value: 'body.result.from', children: telegramFromFields },
    { key: 'status', label: 'Status Code', value: 'status' },
  ],
};

export const telegramSendChatActionActionOutputSchema: OutputSchema = {
  fields: telegramBooleanResultFields,
};

export const telegramDeleteMessageActionOutputSchema: OutputSchema = {
  fields: telegramBooleanResultFields,
};

export const telegramPinMessageActionOutputSchema: OutputSchema = {
  fields: telegramBooleanResultFields,
};

export const telegramUnpinMessageActionOutputSchema: OutputSchema = {
  fields: telegramBooleanResultFields,
};

const telegramChatFullInfoFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Chat ID', value: 'id' },
  { key: 'type', label: 'Chat Type', value: 'type' },
  { key: 'title', label: 'Title', value: 'title' },
  { key: 'username', label: 'Username', value: 'username' },
  { key: 'first_name', label: 'First Name', value: 'first_name' },
  { key: 'last_name', label: 'Last Name', value: 'last_name' },
  { key: 'description', label: 'Description', value: 'description' },
  { key: 'invite_link', label: 'Invite Link', value: 'invite_link', format: 'url' },
];

export const telegramGetChatActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'ok', format: 'boolean' },
    { key: 'result', label: 'Chat', value: 'result', children: telegramChatFullInfoFields },
  ],
};

const telegramChatMemberUserFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID', value: 'id' },
  { key: 'is_bot', label: 'Is Bot', value: 'is_bot', format: 'boolean' },
  { key: 'first_name', label: 'First Name', value: 'first_name' },
  { key: 'username', label: 'Username', value: 'username' },
];

const telegramChatMemberFields: OutputSchema['fields'] = [
  { key: 'status', label: 'Status', value: 'status' },
  { key: 'user', label: 'User', value: 'user', children: telegramChatMemberUserFields },
  { key: 'is_anonymous', label: 'Is Anonymous', value: 'is_anonymous', format: 'boolean' },
  { key: 'can_pin_messages', label: 'Can Pin Messages', value: 'can_pin_messages', format: 'boolean' },
  { key: 'can_invite_users', label: 'Can Invite Users', value: 'can_invite_users', format: 'boolean' },
  {
    key: 'can_delete_messages',
    label: 'Can Delete Messages',
    value: 'can_delete_messages',
    format: 'boolean',
  },
];

export const telegramGetChatMemberActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'ok', format: 'boolean' },
    { key: 'result', label: 'Member', value: 'result', children: telegramChatMemberFields },
  ],
};

export const telegramGetChatAdministratorsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'ok', format: 'boolean' },
    {
      key: 'result',
      label: 'Administrators',
      value: 'result',
      labelKey: 'status',
      listItems: telegramChatMemberFields,
    },
  ],
};

export const telegramGetChatMemberCountActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'ok', format: 'boolean' },
    { key: 'result', label: 'Member Count', value: 'result', format: 'number' },
  ],
};

const telegramBotUserFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Bot ID', value: 'id' },
  { key: 'is_bot', label: 'Is Bot', value: 'is_bot', format: 'boolean' },
  { key: 'first_name', label: 'First Name', value: 'first_name' },
  { key: 'username', label: 'Username', value: 'username' },
  { key: 'can_join_groups', label: 'Can Join Groups', value: 'can_join_groups', format: 'boolean' },
  {
    key: 'can_read_all_group_messages',
    label: 'Can Read All Group Messages',
    value: 'can_read_all_group_messages',
    format: 'boolean',
  },
  {
    key: 'supports_inline_queries',
    label: 'Supports Inline Queries',
    value: 'supports_inline_queries',
    format: 'boolean',
  },
];

export const telegramGetBotInfoActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'ok', format: 'boolean' },
    { key: 'result', label: 'Bot', value: 'result', children: telegramBotUserFields },
  ],
};

const telegramGetFileInfoFields: OutputSchema['fields'] = [
  { key: 'file_id', label: 'File ID', value: 'file_id' },
  { key: 'file_unique_id', label: 'File Unique ID', value: 'file_unique_id' },
  { key: 'file_size', label: 'File Size', value: 'file_size', format: 'filesize' },
  { key: 'file_path', label: 'File Path', value: 'file_path' },
];

export const telegramGetFileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file_info',
      label: 'File Info',
      value: 'file_info',
      children: telegramGetFileInfoFields,
    },
    { key: 'file_url', label: 'File URL', value: 'file_url', format: 'url' },
    { key: 'file_content_base64', label: 'File Content (Base64)', value: 'file_content_base64' },
  ],
};

export const telegramForwardMessageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'body.ok', format: 'boolean' },
    { key: 'message_id', label: 'Message ID', value: 'body.result.message_id' },
    { key: 'date', label: 'Date', value: 'body.result.date', format: 'datetime' },
    {
      key: 'forward_date',
      label: 'Forward Date',
      value: 'body.result.forward_date',
      format: 'datetime',
    },
    { key: 'chat', label: 'Chat', value: 'body.result.chat', children: telegramChatFields },
    { key: 'from', label: 'From', value: 'body.result.from', children: telegramFromFields },
    { key: 'status', label: 'Status Code', value: 'status' },
  ],
};

export const telegramEditMessageTextActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'body.ok', format: 'boolean' },
    { key: 'message_id', label: 'Message ID', value: 'body.result.message_id' },
    { key: 'text', label: 'Message Text', value: 'body.result.text' },
    { key: 'date', label: 'Date', value: 'body.result.date', format: 'datetime' },
    { key: 'edit_date', label: 'Edit Date', value: 'body.result.edit_date', format: 'datetime' },
    { key: 'chat', label: 'Chat', value: 'body.result.chat', children: telegramChatFields },
    { key: 'from', label: 'From', value: 'body.result.from', children: telegramFromFields },
    { key: 'status', label: 'Status Code', value: 'status' },
  ],
};

const telegramInviteLinkCreatorFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID', value: 'id' },
  { key: 'first_name', label: 'First Name', value: 'first_name' },
  { key: 'username', label: 'Username', value: 'username' },
];

const telegramInviteLinkFields: OutputSchema['fields'] = [
  { key: 'invite_link', label: 'Invite Link', value: 'invite_link', format: 'url' },
  { key: 'name', label: 'Name', value: 'name' },
  { key: 'creator', label: 'Creator', value: 'creator', children: telegramInviteLinkCreatorFields },
  {
    key: 'creates_join_request',
    label: 'Creates Join Request',
    value: 'creates_join_request',
    format: 'boolean',
  },
  { key: 'is_primary', label: 'Is Primary', value: 'is_primary', format: 'boolean' },
  { key: 'is_revoked', label: 'Is Revoked', value: 'is_revoked', format: 'boolean' },
];

export const telegramCreateInviteLinkActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ok', label: 'OK', value: 'ok', format: 'boolean' },
    { key: 'result', label: 'Invite Link', value: 'result', children: telegramInviteLinkFields },
  ],
};

export const telegramAnswerCallbackQueryActionOutputSchema: OutputSchema = {
  fields: telegramBooleanResultFields,
};

export const sendTextMessageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'text',
      label: 'Message Text',
      value: 'body.result.text',
    },
    {
      key: 'message_id',
      label: 'Message ID',
      value: 'body.result.message_id',
    },
    {
      key: 'date',
      label: 'Date',
      value: 'body.result.date',
      format: 'datetime',
    },
    {
      key: 'chat',
      label: 'Chat',
      value: 'body.result.chat',
      children: [
        {
          key: 'id',
          label: 'Chat ID',
          value: 'id',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'last_name',
          label: 'Last Name',
          value: 'last_name',
        },
        {
          key: 'type',
          label: 'Chat Type',
          value: 'type',
        },
      ],
    },
    {
      key: 'from',
      label: 'From',
      value: 'body.result.from',
      children: [
        {
          key: 'id',
          label: 'Bot ID',
          value: 'id',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'is_bot',
          label: 'Is Bot',
          value: 'is_bot',
          format: 'boolean',
        },
      ],
    },
    {
      key: 'status',
      label: 'Status Code',
      value: 'status',
    },
  ],
};

export const sendLocationActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'Success',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'message_id',
      label: 'Message ID',
      value: 'body.result.message_id',
    },
    {
      key: 'date',
      label: 'Sent Date',
      value: 'body.result.date',
      format: 'datetime',
    },
    {
      key: 'location',
      label: 'Location',
      value: 'body.result.location',
      children: [
        {
          key: 'latitude',
          label: 'Latitude',
          value: 'latitude',
          format: 'number',
        },
        {
          key: 'longitude',
          label: 'Longitude',
          value: 'longitude',
          format: 'number',
        },
      ],
    },
    {
      key: 'chat',
      label: 'Chat',
      value: 'body.result.chat',
      children: [
        {
          key: 'id',
          label: 'Chat ID',
          value: 'id',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'last_name',
          label: 'Last Name',
          value: 'last_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
      ],
    },
    {
      key: 'from',
      label: 'From',
      value: 'body.result.from',
      children: [
        {
          key: 'id',
          label: 'Bot ID',
          value: 'id',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'is_bot',
          label: 'Is Bot',
          value: 'is_bot',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const sendMediaGroupActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'result',
      label: 'Messages',
      value: 'body.result',
      labelKey: 'caption',
      listItems: [
        {
          key: 'message_id',
          label: 'Message ID',
          value: 'message_id',
        },
        {
          key: 'caption',
          label: 'Caption',
          value: 'caption',
        },
        {
          key: 'media_group_id',
          label: 'Media Group ID',
          value: 'media_group_id',
        },
        {
          key: 'date',
          label: 'Date',
          value: 'date',
          format: 'datetime',
        },
        {
          key: 'chat',
          label: 'Chat',
          value: 'chat',
          children: [
            {
              key: 'id',
              label: 'Chat ID',
              value: 'id',
            },
            {
              key: 'first_name',
              label: 'First Name',
              value: 'first_name',
            },
            {
              key: 'last_name',
              label: 'Last Name',
              value: 'last_name',
            },
            {
              key: 'username',
              label: 'Username',
              value: 'username',
            },
            {
              key: 'type',
              label: 'Type',
              value: 'type',
            },
          ],
        },
        {
          key: 'from',
          label: 'From',
          value: 'from',
          children: [
            {
              key: 'id',
              label: 'Bot ID',
              value: 'id',
            },
            {
              key: 'first_name',
              label: 'First Name',
              value: 'first_name',
            },
            {
              key: 'username',
              label: 'Username',
              value: 'username',
            },
            {
              key: 'is_bot',
              label: 'Is Bot',
              value: 'is_bot',
              format: 'boolean',
            },
          ],
        },
        {
          key: 'photo',
          label: 'Photo Sizes',
          value: 'photo',
          labelKey: 'width',
          listItems: [
            {
              key: 'file_id',
              label: 'File ID',
              value: 'file_id',
            },
            {
              key: 'file_unique_id',
              label: 'File Unique ID',
              value: 'file_unique_id',
            },
            {
              key: 'width',
              label: 'Width',
              value: 'width',
              format: 'number',
            },
            {
              key: 'height',
              label: 'Height',
              value: 'height',
              format: 'number',
            },
            {
              key: 'file_size',
              label: 'File Size',
              value: 'file_size',
              format: 'filesize',
            },
          ],
        },
      ],
    },
  ],
};

export const sendPollActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'Success',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'result',
      label: 'Result',
      value: 'body.result',
      children: [
        {
          key: 'message_id',
          label: 'Message ID',
          value: 'message_id',
        },
        {
          key: 'date',
          label: 'Date',
          value: 'date',
          format: 'datetime',
        },
        {
          key: 'chat',
          label: 'Chat',
          value: 'chat',
          children: [
            {
              key: 'id',
              label: 'Chat ID',
              value: 'id',
            },
            {
              key: 'first_name',
              label: 'First Name',
              value: 'first_name',
            },
            {
              key: 'last_name',
              label: 'Last Name',
              value: 'last_name',
            },
            {
              key: 'username',
              label: 'Username',
              value: 'username',
            },
            {
              key: 'type',
              label: 'Type',
              value: 'type',
            },
          ],
        },
        {
          key: 'from',
          label: 'From',
          value: 'from',
          children: [
            {
              key: 'id',
              label: 'Bot ID',
              value: 'id',
            },
            {
              key: 'first_name',
              label: 'First Name',
              value: 'first_name',
            },
            {
              key: 'username',
              label: 'Username',
              value: 'username',
            },
            {
              key: 'is_bot',
              label: 'Is Bot',
              value: 'is_bot',
              format: 'boolean',
            },
          ],
        },
        {
          key: 'poll',
          label: 'Poll',
          value: 'poll',
          children: [
            {
              key: 'question',
              label: 'Question',
              value: 'question',
            },
            {
              key: 'id',
              label: 'Poll ID',
              value: 'id',
            },
            {
              key: 'type',
              label: 'Type',
              value: 'type',
            },
            {
              key: 'total_voter_count',
              label: 'Total Voter Count',
              value: 'total_voter_count',
              format: 'number',
            },
            {
              key: 'is_closed',
              label: 'Is Closed',
              value: 'is_closed',
              format: 'boolean',
            },
            {
              key: 'is_anonymous',
              label: 'Is Anonymous',
              value: 'is_anonymous',
              format: 'boolean',
            },
            {
              key: 'allows_multiple_answers',
              label: 'Allows Multiple Answers',
              value: 'allows_multiple_answers',
              format: 'boolean',
            },
            {
              key: 'allows_revoting',
              label: 'Allows Revoting',
              value: 'allows_revoting',
              format: 'boolean',
            },
            {
              key: 'options',
              label: 'Options',
              value: 'options',
              labelKey: 'text',
              listItems: [
                {
                  key: 'text',
                  label: 'Text',
                  value: 'text',
                },
                {
                  key: 'persistent_id',
                  label: 'Option ID',
                  value: 'persistent_id',
                },
                {
                  key: 'voter_count',
                  label: 'Voter Count',
                  value: 'voter_count',
                  format: 'number',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const sendChatActionActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'result',
      label: 'Result',
      value: 'body.result',
      format: 'boolean',
    },
    {
      key: 'status',
      label: 'Status Code',
      value: 'status',
    },
  ],
};

export const deleteMessageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'result',
      label: 'Result',
      value: 'body.result',
      format: 'boolean',
    },
    {
      key: 'status',
      label: 'Status',
      value: 'status',
    },
  ],
};

export const getChatActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'Success',
      value: 'ok',
      format: 'boolean',
    },
    {
      key: 'result',
      label: 'Chat',
      value: 'result',
      children: [
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'last_name',
          label: 'Last Name',
          value: 'last_name',
        },
        {
          key: 'type',
          label: 'Chat Type',
          value: 'type',
        },
        {
          key: 'id',
          label: 'Chat ID',
          value: 'id',
        },
        {
          key: 'max_reaction_count',
          label: 'Max Reaction Count',
          value: 'max_reaction_count',
          format: 'number',
        },
        {
          key: 'can_send_gift',
          label: 'Can Send Gift',
          value: 'can_send_gift',
          format: 'boolean',
        },
        {
          key: 'active_usernames',
          label: 'Active Usernames',
          value: 'active_usernames',
        },
        {
          key: 'accepted_gift_types',
          label: 'Accepted Gift Types',
          value: 'accepted_gift_types',
          children: [
            {
              key: 'unlimited_gifts',
              label: 'Unlimited Gifts',
              value: 'unlimited_gifts',
              format: 'boolean',
            },
            {
              key: 'limited_gifts',
              label: 'Limited Gifts',
              value: 'limited_gifts',
              format: 'boolean',
            },
            {
              key: 'unique_gifts',
              label: 'Unique Gifts',
              value: 'unique_gifts',
              format: 'boolean',
            },
            {
              key: 'premium_subscription',
              label: 'Premium Subscription',
              value: 'premium_subscription',
              format: 'boolean',
            },
            {
              key: 'gifts_from_channels',
              label: 'Gifts From Channels',
              value: 'gifts_from_channels',
              format: 'boolean',
            },
          ],
        },
      ],
    },
  ],
};

export const getChatMemberActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'ok',
      format: 'boolean',
    },
    {
      key: 'result',
      label: 'Member',
      value: 'result',
      children: [
        {
          key: 'status',
          label: 'Status',
          value: 'status',
        },
        {
          key: 'user',
          label: 'User',
          value: 'user',
          children: [
            {
              key: 'first_name',
              label: 'First Name',
              value: 'first_name',
            },
            {
              key: 'last_name',
              label: 'Last Name',
              value: 'last_name',
            },
            {
              key: 'username',
              label: 'Username',
              value: 'username',
            },
            {
              key: 'id',
              label: 'User ID',
              value: 'id',
            },
            {
              key: 'is_bot',
              label: 'Is Bot',
              value: 'is_bot',
              format: 'boolean',
            },
            {
              key: 'language_code',
              label: 'Language Code',
              value: 'language_code',
            },
          ],
        },
      ],
    },
  ],
};

export const pinMessageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'result',
      label: 'Result',
      value: 'body.result',
      format: 'boolean',
    },
    {
      key: 'status',
      label: 'Status Code',
      value: 'status',
    },
  ],
};

export const unpinMessageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'result',
      label: 'Result',
      value: 'body.result',
      format: 'boolean',
    },
    {
      key: 'status',
      label: 'Status Code',
      value: 'status',
    },
  ],
};

export const sendMediaActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'message_id',
      label: 'Message ID',
      value: 'body.result.message_id',
    },
    {
      key: 'date',
      label: 'Date',
      value: 'body.result.date',
      format: 'datetime',
    },
    {
      key: 'from',
      label: 'From',
      value: 'body.result.from',
      children: [
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'is_bot',
          label: 'Is Bot',
          value: 'is_bot',
          format: 'boolean',
        },
        {
          key: 'id',
          label: 'ID',
          value: 'id',
        },
      ],
    },
    {
      key: 'chat',
      label: 'Chat',
      value: 'body.result.chat',
      children: [
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'last_name',
          label: 'Last Name',
          value: 'last_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
        {
          key: 'id',
          label: 'Chat ID',
          value: 'id',
        },
      ],
    },
    {
      key: 'photo',
      label: 'Photo',
      value: 'body.result.photo',
      labelKey: 'width',
      listItems: [
        {
          key: 'file_id',
          label: 'File ID',
          value: 'file_id',
        },
        {
          key: 'file_unique_id',
          label: 'File Unique ID',
          value: 'file_unique_id',
        },
        {
          key: 'width',
          label: 'Width',
          value: 'width',
          format: 'number',
        },
        {
          key: 'height',
          label: 'Height',
          value: 'height',
          format: 'number',
        },
        {
          key: 'file_size',
          label: 'File Size',
          value: 'file_size',
          format: 'filesize',
        },
      ],
    },
  ],
};

export const sendDocumentActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'message_id',
      label: 'Message ID',
      value: 'body.result.message_id',
    },
    {
      key: 'date',
      label: 'Date',
      value: 'body.result.date',
      format: 'datetime',
    },
    {
      key: 'chat',
      label: 'Chat',
      value: 'body.result.chat',
      children: [
        {
          key: 'id',
          label: 'Chat ID',
          value: 'id',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'last_name',
          label: 'Last Name',
          value: 'last_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
      ],
    },
    {
      key: 'from',
      label: 'From',
      value: 'body.result.from',
      children: [
        {
          key: 'id',
          label: 'Bot ID',
          value: 'id',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'is_bot',
          label: 'Is Bot',
          value: 'is_bot',
          format: 'boolean',
        },
      ],
    },
    {
      key: 'document',
      label: 'Document',
      value: 'body.result.document',
      children: [
        {
          key: 'file_name',
          label: 'File Name',
          value: 'file_name',
        },
        {
          key: 'mime_type',
          label: 'MIME Type',
          value: 'mime_type',
        },
        {
          key: 'file_size',
          label: 'File Size',
          value: 'file_size',
          format: 'filesize',
        },
        {
          key: 'file_id',
          label: 'File ID',
          value: 'file_id',
        },
        {
          key: 'file_unique_id',
          label: 'File Unique ID',
          value: 'file_unique_id',
        },
      ],
    },
  ],
};

export const sendAudioActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'message_id',
      label: 'Message ID',
      value: 'body.result.message_id',
    },
    {
      key: 'date',
      label: 'Sent Date',
      value: 'body.result.date',
      format: 'datetime',
    },
    {
      key: 'audio',
      label: 'Audio',
      value: 'body.result.audio',
      children: [
        {
          key: 'file_name',
          label: 'File Name',
          value: 'file_name',
        },
        {
          key: 'duration',
          label: 'Duration',
          value: 'duration',
          format: 'duration',
        },
        {
          key: 'mime_type',
          label: 'MIME Type',
          value: 'mime_type',
        },
        {
          key: 'file_size',
          label: 'File Size',
          value: 'file_size',
          format: 'filesize',
        },
        {
          key: 'file_id',
          label: 'File ID',
          value: 'file_id',
        },
        {
          key: 'file_unique_id',
          label: 'File Unique ID',
          value: 'file_unique_id',
        },
      ],
    },
    {
      key: 'chat',
      label: 'Chat',
      value: 'body.result.chat',
      children: [
        {
          key: 'id',
          label: 'Chat ID',
          value: 'id',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'last_name',
          label: 'Last Name',
          value: 'last_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
      ],
    },
    {
      key: 'from',
      label: 'From',
      value: 'body.result.from',
      children: [
        {
          key: 'id',
          label: 'Bot ID',
          value: 'id',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'is_bot',
          label: 'Is Bot',
          value: 'is_bot',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const requestApprovalMessageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'approved',
      label: 'Approved',
      format: 'boolean',
    },
    {
      key: 'chatId',
      label: 'Chat ID',
    },
  ],
};

export const getFileActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file_url',
      label: 'File URL',
      value: 'file_url',
      format: 'url',
    },
    {
      key: 'file_info',
      label: 'File Info',
      value: 'file_info',
      children: [
        {
          key: 'file_path',
          label: 'File Path',
          value: 'file_path',
        },
        {
          key: 'file_size',
          label: 'File Size',
          value: 'file_size',
          format: 'filesize',
        },
        {
          key: 'file_id',
          label: 'File ID',
          value: 'file_id',
        },
        {
          key: 'file_unique_id',
          label: 'File Unique ID',
          value: 'file_unique_id',
        },
      ],
    },
  ],
};

export const forwardMessageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'text',
      label: 'Message Text',
      value: 'body.result.text',
    },
    {
      key: 'message_id',
      label: 'Message ID',
      value: 'body.result.message_id',
    },
    {
      key: 'date',
      label: 'Date',
      value: 'body.result.date',
      format: 'datetime',
    },
    {
      key: 'forward_date',
      label: 'Forward Date',
      value: 'body.result.forward_date',
      format: 'datetime',
    },
    {
      key: 'chat',
      label: 'Chat',
      value: 'body.result.chat',
      children: [
        {
          key: 'id',
          label: 'Chat ID',
          value: 'id',
        },
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'last_name',
          label: 'Last Name',
          value: 'last_name',
        },
      ],
    },
    {
      key: 'from',
      label: 'From',
      value: 'body.result.from',
      children: [
        {
          key: 'id',
          label: 'User ID',
          value: 'id',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'is_bot',
          label: 'Is Bot',
          value: 'is_bot',
          format: 'boolean',
        },
      ],
    },
    {
      key: 'forward_from',
      label: 'Forward From',
      value: 'body.result.forward_from',
      children: [
        {
          key: 'id',
          label: 'User ID',
          value: 'id',
        },
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'is_bot',
          label: 'Is Bot',
          value: 'is_bot',
          format: 'boolean',
        },
      ],
    },
    {
      key: 'forward_origin',
      label: 'Forward Origin',
      value: 'body.result.forward_origin',
      children: [
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
        {
          key: 'date',
          label: 'Date',
          value: 'date',
          format: 'datetime',
        },
        {
          key: 'sender_user',
          label: 'Sender User',
          value: 'sender_user',
          children: [
            {
              key: 'id',
              label: 'User ID',
              value: 'id',
            },
            {
              key: 'first_name',
              label: 'First Name',
              value: 'first_name',
            },
            {
              key: 'username',
              label: 'Username',
              value: 'username',
            },
          ],
        },
      ],
    },
  ],
};

export const editMessageTextActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'body.ok',
      format: 'boolean',
    },
    {
      key: 'result',
      label: 'Result',
      value: 'body.result',
      children: [
        {
          key: 'text',
          label: 'Message Text',
          value: 'text',
        },
        {
          key: 'message_id',
          label: 'Message ID',
          value: 'message_id',
        },
        {
          key: 'date',
          label: 'Sent Date',
          value: 'date',
          format: 'datetime',
        },
        {
          key: 'edit_date',
          label: 'Edit Date',
          value: 'edit_date',
          format: 'datetime',
        },
        {
          key: 'from',
          label: 'From',
          value: 'from',
          children: [
            {
              key: 'first_name',
              label: 'First Name',
              value: 'first_name',
            },
            {
              key: 'username',
              label: 'Username',
              value: 'username',
            },
            {
              key: 'id',
              label: 'User ID',
              value: 'id',
            },
            {
              key: 'is_bot',
              label: 'Is Bot',
              value: 'is_bot',
              format: 'boolean',
            },
          ],
        },
        {
          key: 'chat',
          label: 'Chat',
          value: 'chat',
          children: [
            {
              key: 'first_name',
              label: 'First Name',
              value: 'first_name',
            },
            {
              key: 'last_name',
              label: 'Last Name',
              value: 'last_name',
            },
            {
              key: 'username',
              label: 'Username',
              value: 'username',
            },
            {
              key: 'type',
              label: 'Chat Type',
              value: 'type',
            },
            {
              key: 'id',
              label: 'Chat ID',
              value: 'id',
            },
          ],
        },
      ],
    },
    {
      key: 'status',
      label: 'Status Code',
      value: 'status',
    },
  ],
};

export const createInviteLinkActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ok',
      label: 'OK',
      value: 'ok',
      format: 'boolean',
    },
    {
      key: 'invite_link',
      label: 'Invite Link',
      value: 'result.invite_link',
      format: 'url',
    },
    {
      key: 'name',
      label: 'Name',
      value: 'result.name',
    },
    {
      key: 'creates_join_request',
      label: 'Creates Join Request',
      value: 'result.creates_join_request',
      format: 'boolean',
    },
    {
      key: 'is_primary',
      label: 'Is Primary',
      value: 'result.is_primary',
      format: 'boolean',
    },
    {
      key: 'is_revoked',
      label: 'Is Revoked',
      value: 'result.is_revoked',
      format: 'boolean',
    },
    {
      key: 'creator',
      label: 'Creator',
      value: 'result.creator',
      children: [
        {
          key: 'first_name',
          label: 'First Name',
          value: 'first_name',
        },
        {
          key: 'username',
          label: 'Username',
          value: 'username',
        },
        {
          key: 'id',
          label: 'Creator ID',
          value: 'id',
        },
        {
          key: 'is_bot',
          label: 'Is Bot',
          value: 'is_bot',
          format: 'boolean',
        },
      ],
    },
  ],
};
