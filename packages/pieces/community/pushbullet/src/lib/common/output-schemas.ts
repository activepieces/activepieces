import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const pushFields: OutputSchemaField[] = [
  { key: 'iden', label: 'Push ID', description: 'Use this to dismiss or delete the push in a later step.' },
  { key: 'type', label: 'Type', description: 'note, link or file.' },
  { key: 'title', label: 'Title' },
  { key: 'body', label: 'Body' },
  { key: 'url', label: 'URL', format: 'url', description: 'Only set on link pushes.' },
  { key: 'active', label: 'Active', format: 'boolean', description: 'False once the push is deleted.' },
  { key: 'dismissed', label: 'Dismissed', format: 'boolean' },
  { key: 'created', label: 'Created', format: 'number', description: 'Unix time in seconds (with fractions).' },
  { key: 'modified', label: 'Modified', format: 'number', description: 'Unix time in seconds (with fractions).' },
  { key: 'direction', label: 'Direction', description: 'self, outgoing or incoming.' },
  { key: 'sender_iden', label: 'Sender ID' },
  { key: 'sender_email', label: 'Sender Email', format: 'email' },
  { key: 'sender_email_normalized', label: 'Sender Email (Normalized)', format: 'email' },
  { key: 'sender_name', label: 'Sender Name' },
  { key: 'receiver_iden', label: 'Receiver ID' },
  { key: 'receiver_email', label: 'Receiver Email', format: 'email' },
  { key: 'receiver_email_normalized', label: 'Receiver Email (Normalized)', format: 'email' },
  { key: 'target_device_iden', label: 'Target Device ID' },
  { key: 'source_device_iden', label: 'Source Device ID' },
  { key: 'channel_iden', label: 'Channel ID' },
  { key: 'channel_tag', label: 'Channel Tag' },
  { key: 'sent_to_channel', label: 'Sent to Channel', format: 'boolean' },
  { key: 'file_name', label: 'File Name' },
  { key: 'file_type', label: 'File Type' },
  { key: 'file_url', label: 'File URL', format: 'url' },
  { key: 'image_url', label: 'Image URL', format: 'image' },
];

const pushOutputSchema: OutputSchema = { fields: pushFields };

const listPushesOutputSchema: OutputSchema = {
  fields: [
    { key: 'pushes', label: 'Pushes', labelKey: 'title', listItems: pushFields },
    {
      key: 'cursor',
      label: 'Next Page Cursor',
      description: 'Pass this as Cursor to get the next page. Empty when there are no more pushes.',
    },
  ],
};

const deletePushOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Deleted', format: 'boolean' },
    { key: 'iden', label: 'Push ID' },
  ],
};

const listDevicesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'devices',
      label: 'Devices',
      labelKey: 'nickname',
      listItems: [
        { key: 'iden', label: 'Device ID', description: 'Use this as the target device of a push.' },
        { key: 'nickname', label: 'Nickname' },
        { key: 'manufacturer', label: 'Manufacturer' },
        { key: 'model', label: 'Model' },
        { key: 'type', label: 'Type', description: 'e.g. android, ios, chrome, firefox, windows.' },
        { key: 'pushable', label: 'Can Receive Pushes', format: 'boolean' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'created', label: 'Created', format: 'number' },
        { key: 'modified', label: 'Modified', format: 'number' },
      ],
    },
  ],
};

const listChatsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'chats',
      label: 'Chats',
      listItems: [
        { key: 'iden', label: 'Chat ID' },
        { key: 'muted', label: 'Muted', format: 'boolean' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'created', label: 'Created', format: 'number' },
        { key: 'modified', label: 'Modified', format: 'number' },
        {
          key: 'with',
          label: 'Contact',
          children: [
            { key: 'email', label: 'Email', format: 'email', description: 'Use this as the target email of a push.' },
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type', description: 'user or email.' },
            { key: 'iden', label: 'User ID' },
            { key: 'image_url', label: 'Image URL', format: 'image' },
          ],
        },
      ],
    },
  ],
};

const currentUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'iden', label: 'User ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'email_normalized', label: 'Normalized Email', format: 'email' },
    { key: 'name', label: 'Name' },
    { key: 'image_url', label: 'Image URL', format: 'image' },
    { key: 'max_upload_size', label: 'Max Upload Size', format: 'filesize' },
    { key: 'created', label: 'Created', format: 'number' },
    { key: 'modified', label: 'Modified', format: 'number' },
  ],
};

export const pushbulletOutputSchemas = {
  push: pushOutputSchema,
  listPushes: listPushesOutputSchema,
  deletePush: deletePushOutputSchema,
  listDevices: listDevicesOutputSchema,
  listChats: listChatsOutputSchema,
  currentUser: currentUserOutputSchema,
};
