import { OutputSchema } from '@activepieces/pieces-framework';

const crmContactFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'name', label: 'Name' },
  { key: 'tags', label: 'Tags' },
  { key: 'source', label: 'Source' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const crmContactOutputSchema: OutputSchema = {
  fields: crmContactFields,
};

export const deleteCrmContactOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const listCrmContactsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items', label: 'Contacts', labelKey: 'name',
      listItems: crmContactFields,
    },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const listCrmTagsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items', label: 'Tags', labelKey: 'tag',
      listItems: [
        { key: 'tag', label: 'Tag' },
        { key: 'count', label: 'Contact Count', format: 'number' },
      ],
    },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

const sendMessageResultFields: OutputSchema['fields'] = [
  { key: 'message_id', label: 'Message ID' },
  { key: 'chat_id', label: 'Chat ID' },
  { key: 'sender_id', label: 'Sender ID' },
  { key: 'is_group', label: 'Is Group', format: 'boolean' },
  { key: 'is_from_me', label: 'Is From Me', format: 'boolean' },
  { key: 'sent_at', label: 'Sent At', format: 'datetime' },
];

export const sendMessageResultOutputSchema: OutputSchema = {
  fields: sendMessageResultFields,
};

export const checkWhatsappOutputSchema: OutputSchema = {
  fields: [
    { key: 'numberExists', label: 'Number Exists', format: 'boolean' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'phoneFormatted', label: 'Formatted Phone Number' },
    { key: 'chatId', label: 'Chat ID' },
  ],
};

export const listSessionsOutputSchema: OutputSchema = {
  itemLabel: '{push_name} ({status})',
  fields: [
    {
      key: 'sessions', label: 'Sessions', value: '',
      listItems: [
        { key: 'session_name', label: 'Session Name' },
        { key: 'status', label: 'Status' },
        { key: 'presence', label: 'Presence' },
        { key: 'phone_number', label: 'Phone Number' },
        { key: 'push_name', label: 'Push Name' },
        { key: 'jid', label: 'JID' },
      ],
    },
  ],
};

export const listWhatsappGroupsOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'groups', label: 'Groups', value: '',
      listItems: [
        { key: 'group_id', label: 'Group ID' },
        { key: 'name', label: 'Name' },
        { key: 'size', label: 'Size', format: 'number' },
        { key: 'admin_count', label: 'Admin Count', format: 'number' },
      ],
    },
  ],
};

const groupParticipantResultFields: OutputSchema['fields'] = [
  { key: 'jid', label: 'JID' },
  { key: 'phone_number', label: 'Phone Number' },
  { key: 'is_admin', label: 'Is Admin', format: 'boolean' },
  { key: 'is_super_admin', label: 'Is Super Admin', format: 'boolean' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'error', label: 'Error Code', format: 'number' },
];

export const groupParticipantResultOutputSchema: OutputSchema = {
  itemLabel: '{phone_number}',
  fields: [
    {
      key: 'participants', label: 'Participants', value: '',
      listItems: groupParticipantResultFields,
    },
  ],
};

export const listGroupParticipantsOutputSchema: OutputSchema = {
  itemLabel: '{phone_number} ({role})',
  fields: [
    {
      key: 'participants', label: 'Participants', value: '',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'pn', label: 'Phone Number' },
        { key: 'role', label: 'Role' },
      ],
    },
  ],
};

export const listWhatsappContactsOutputSchema: OutputSchema = {
  itemLabel: '{pushname}',
  fields: [
    {
      key: 'contacts', label: 'Contacts', value: '',
      listItems: [
        { key: 'id', label: 'Contact ID' },
        { key: 'name', label: 'Name' },
        { key: 'pushname', label: 'Push Name' },
      ],
    },
  ],
};

const inboundMessageFields: OutputSchema['fields'] = [
  { key: 'body', label: 'Message Body' },
  { key: 'has_media', label: 'Has Media', format: 'boolean' },
  { key: 'media_type', label: 'Media Type' },
  { key: 'media_url', label: 'Media URL' },
  { key: 'media_mimetype', label: 'Media MIME Type' },
  { key: 'media_filename', label: 'Media Filename' },
  { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
  { key: 'is_forwarded', label: 'Is Forwarded', format: 'boolean' },
  { key: 'quoted_message_id', label: 'Quoted Message ID' },
  { key: 'quoted_body', label: 'Quoted Message Body' },
  { key: 'is_reply', label: 'Is Reply', format: 'boolean' },
  { key: 'session_name', label: 'Session' },
];

export const incomingMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'message_id', label: 'Message ID' },
    { key: 'chat_id', label: 'Chat ID' },
    { key: 'from_number', label: 'From Phone Number' },
    { key: 'from_id', label: 'From ID' },
    { key: 'from_name', label: 'From Name' },
    ...inboundMessageFields,
  ],
};

export const groupMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'message_id', label: 'Message ID' },
    { key: 'group_id', label: 'Group ID' },
    { key: 'chat_id', label: 'Chat ID' },
    { key: 'participant_id', label: 'Participant ID' },
    { key: 'participant_name', label: 'Participant Name' },
    { key: 'participant_phone', label: 'Participant Phone Number' },
    { key: 'from_name', label: 'From Name' },
    ...inboundMessageFields,
  ],
};
