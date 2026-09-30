import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

/**
 * Fields of one ntfy message (the JSON ntfy returns from a publish and from /json polls).
 * `prefix` is the path to the message inside the step output ('body.' for Send Notification,
 * which returns the whole HTTP response; '' for actions that return the message itself).
 */
function messageFields(
  prefix: string,
  { uploads = true, omit = [] }: { uploads?: boolean; omit?: string[] } = {}
): OutputSchemaField[] {
  const at = (key: string) => (prefix ? { value: `${prefix}${key}` } : {});
  const attachmentChildren: OutputSchemaField[] = [
    { key: 'name', label: 'File Name' },
    { key: 'url', label: 'URL', format: 'url' },
  ];
  if (uploads) {
    attachmentChildren.push(
      { key: 'type', label: 'MIME Type' },
      { key: 'size', label: 'Size', format: 'filesize' },
      {
        key: 'expires',
        label: 'Expires',
        description: 'Unix timestamp in seconds when the uploaded file is deleted (3 hours after upload by default).',
      }
    );
  }
  const fields: OutputSchemaField[] = [
    {
      key: 'id',
      label: 'Message ID',
      ...at('id'),
      description: 'Identifier ntfy assigned to the published message.',
    },
    {
      key: 'topic',
      label: 'Topic',
      ...at('topic'),
      description: 'The topic the message was published to.',
    },
    {
      key: 'title',
      label: 'Title',
      ...at('title'),
    },
    {
      key: 'message',
      label: 'Message',
      ...at('message'),
    },
    {
      key: 'time',
      label: 'Delivery Time',
      ...at('time'),
      description:
        'Unix timestamp in seconds for when ntfy delivers the message. Equal to the send time unless Delay was set, in which case it is the scheduled delivery time.',
    },
    {
      key: 'expires',
      label: 'Expires',
      ...at('expires'),
      description:
        'Unix timestamp in seconds for when ntfy stops caching the message, always 12 hours after Delivery Time.',
    },
    {
      key: 'event',
      label: 'Event',
      ...at('event'),
      description: 'The ntfy event type, "message" for a published notification.',
    },
    {
      key: 'priority',
      label: 'Priority',
      ...at('priority'),
      format: 'number',
      description: '1 (lowest) to 5 (highest). Omitted by ntfy when the default priority 3 was used.',
    },
    {
      key: 'tags',
      label: 'Tags',
      ...at('tags'),
      description: 'Only present when tags were sent.',
    },
    {
      key: 'click',
      label: 'Click URL',
      ...at('click'),
      format: 'url',
      description: 'Opened when the notification is clicked. Only present when a click URL was sent.',
    },
    {
      key: 'icon',
      label: 'Icon',
      ...at('icon'),
      format: 'image',
      description: 'Only present when an icon URL was sent.',
    },
    {
      key: 'actions',
      label: 'Action Buttons',
      ...at('actions'),
      labelKey: 'label',
      description: 'Only present when action buttons were sent.',
      listItems: [
        { key: 'id', label: 'Action ID' },
        { key: 'action', label: 'Type', description: 'One of "view", "http", "broadcast" or "copy".' },
        { key: 'label', label: 'Label' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'clear', label: 'Clear Notification', format: 'boolean' },
      ],
    },
    {
      key: 'sequence_id',
      label: 'Sequence ID',
      ...at('sequence_id'),
      description:
        'Only present when a Sequence ID was set. Use it (or the Message ID) to update, clear or delete this notification.',
    },
    {
      key: 'content_type',
      label: 'Content Type',
      ...at('content_type'),
      description: '"text/markdown" when the message was sent as Markdown, otherwise absent.',
    },
    {
      key: 'attachment',
      label: 'Attachment',
      ...at('attachment'),
      description: uploads
        ? 'Only present when a file or attachment URL was sent. Type, size and expiry are only set for files uploaded to the ntfy server.'
        : 'Only present when an attachment URL was sent.',
      children: attachmentChildren,
    },
  ];
  return fields.filter((field) => !omit.includes(field.key));
}

export const sendNotificationActionOutputSchema: OutputSchema = {
  fields: messageFields('body.', { uploads: false }),
};

export const publishedMessageOutputSchema: OutputSchema = {
  fields: messageFields('', { uploads: false }),
};

export const sentFileOutputSchema: OutputSchema = {
  fields: messageFields('', { omit: ['icon', 'actions', 'sequence_id', 'content_type'] }),
};

export const sequenceEventOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Event ID', description: 'ID of the clear/delete event ntfy appended to the topic.' },
    { key: 'sequence_id', label: 'Sequence ID', description: 'The notification the event applies to.' },
    { key: 'topic', label: 'Topic' },
    {
      key: 'event',
      label: 'Event',
      description: '"message_clear" (marked read and dismissed) or "message_delete" (removed, or scheduled message cancelled).',
    },
    { key: 'time', label: 'Time', description: 'Unix timestamp in seconds when the event was published.' },
    { key: 'expires', label: 'Expires', description: 'Unix timestamp in seconds for when ntfy stops caching the event.' },
  ],
};

const messageListFields = (description: string): OutputSchemaField[] => [
  {
    key: 'messages',
    label: 'Messages',
    labelKey: 'message',
    description,
    listItems: messageFields(''),
  },
  { key: 'count', label: 'Count', format: 'number', description: 'Number of messages returned.' },
];

export const fetchMessagesOutputSchema: OutputSchema = {
  fields: [
    ...messageListFields('Cached messages, newest first.'),
    {
      key: 'total_matched',
      label: 'Total Matched',
      format: 'number',
      description: 'Messages that matched before Limit was applied.',
    },
    {
      key: 'has_more',
      label: 'Has More',
      format: 'boolean',
      description: 'True when Limit cut off older matching messages.',
    },
    {
      key: 'server_truncated',
      label: 'Server Truncated',
      format: 'boolean',
      description: 'True when the ntfy server capped the replay (X-Messages-Truncated), so older messages were not returned.',
    },
  ],
};

export const listScheduledMessagesOutputSchema: OutputSchema = {
  fields: messageListFields('Messages scheduled for later delivery that have not been delivered yet, soonest first.'),
};

export const accountOutputSchema: OutputSchema = {
  fields: [
    { key: 'username', label: 'Username', description: '"*" for anonymous access (no token or no account).' },
    { key: 'role', label: 'Role', description: 'anonymous, user or admin.' },
    { key: 'tier_code', label: 'Tier Code' },
    { key: 'tier_name', label: 'Tier Name' },
    { key: 'limits_basis', label: 'Limits Based On', description: '"ip" (per IP address) or "tier".' },
    { key: 'limits_messages', label: 'Daily Message Limit', format: 'number' },
    {
      key: 'limits_messages_expiry_duration',
      label: 'Message Cache Duration',
      format: 'number',
      description: 'Seconds.',
    },
    { key: 'limits_emails', label: 'Daily Email Limit', format: 'number' },
    { key: 'limits_calls', label: 'Daily Call Limit', format: 'number' },
    { key: 'limits_reservations', label: 'Reserved Topic Limit', format: 'number' },
    { key: 'limits_attachment_file_size', label: 'Max Attachment Size', format: 'filesize' },
    { key: 'limits_attachment_total_size', label: 'Attachment Storage Limit', format: 'filesize' },
    {
      key: 'limits_attachment_expiry_duration',
      label: 'Attachment Expiry',
      format: 'number',
      description: 'Seconds.',
    },
    { key: 'limits_attachment_bandwidth', label: 'Daily Attachment Bandwidth', format: 'filesize' },
    { key: 'stats_messages', label: 'Messages Sent Today', format: 'number' },
    { key: 'stats_messages_remaining', label: 'Messages Remaining Today', format: 'number' },
    { key: 'stats_emails', label: 'Emails Sent Today', format: 'number' },
    { key: 'stats_emails_remaining', label: 'Emails Remaining Today', format: 'number' },
    { key: 'stats_calls', label: 'Calls Made Today', format: 'number' },
    { key: 'stats_calls_remaining', label: 'Calls Remaining Today', format: 'number' },
    { key: 'stats_reservations', label: 'Reserved Topics', format: 'number' },
    { key: 'stats_reservations_remaining', label: 'Reserved Topics Remaining', format: 'number' },
    { key: 'stats_attachment_total_size', label: 'Attachment Storage Used', format: 'filesize' },
    { key: 'stats_attachment_total_size_remaining', label: 'Attachment Storage Remaining', format: 'filesize' },
    {
      key: 'reserved_topics',
      label: 'Reserved Topics',
      description: 'Comma-separated names of topics reserved by this account, empty when none.',
    },
  ],
};

export const serverStatsOutputSchema: OutputSchema = {
  fields: [
    { key: 'messages', label: 'Messages Published', format: 'number', description: 'Total messages since the server started counting.' },
    { key: 'messages_rate', label: 'Messages per Second', format: 'number', description: 'Recent average publish rate.' },
  ],
};

export const serverHealthOutputSchema: OutputSchema = {
  fields: [
    { key: 'healthy', label: 'Healthy', format: 'boolean' },
    { key: 'server_url', label: 'Server URL', format: 'url' },
  ],
};

export const attachmentInfoOutputSchema: OutputSchema = {
  fields: [
    { key: 'message_id', label: 'Message ID' },
    { key: 'exists', label: 'Exists', format: 'boolean', description: 'False when the file was never uploaded or has expired.' },
    { key: 'size_bytes', label: 'Size', format: 'filesize' },
    { key: 'content_type', label: 'Content Type', description: 'Null when the server does not report it.' },
    { key: 'url', label: 'Download URL', format: 'url' },
  ],
};

export const newMessageTriggerOutputSchema: OutputSchema = {
  fields: messageFields(''),
};
