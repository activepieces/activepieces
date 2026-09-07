import { OutputSchema } from '@activepieces/pieces-framework';

export const sendNotificationActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Message ID',
      value: 'body.id',
      description: 'Identifier ntfy assigned to the published message.',
    },
    {
      key: 'topic',
      label: 'Topic',
      value: 'body.topic',
      description: 'The topic the message was published to.',
    },
    {
      key: 'title',
      label: 'Title',
      value: 'body.title',
    },
    {
      key: 'message',
      label: 'Message',
      value: 'body.message',
    },
    {
      key: 'time',
      label: 'Delivery Time',
      value: 'body.time',
      description:
        'Unix timestamp in seconds for when ntfy delivers the message. Equal to the send time unless Delay was set, in which case it is the scheduled delivery time.',
    },
    {
      key: 'expires',
      label: 'Expires',
      value: 'body.expires',
      description:
        'Unix timestamp in seconds for when ntfy stops caching the message, always 12 hours after Delivery Time.',
    },
    {
      key: 'event',
      label: 'Event',
      value: 'body.event',
      description: 'The ntfy event type, "message" for a published notification.',
    },
    {
      key: 'priority',
      label: 'Priority',
      value: 'body.priority',
      format: 'number',
      description: '1 (lowest) to 5 (highest). Omitted by ntfy when the default priority 3 was used.',
    },
    {
      key: 'tags',
      label: 'Tags',
      value: 'body.tags',
      description: 'Only present when tags were sent.',
    },
    {
      key: 'click',
      label: 'Click URL',
      value: 'body.click',
      format: 'url',
      description: 'Opened when the notification is clicked. Only present when a click URL was sent.',
    },
    {
      key: 'icon',
      label: 'Icon',
      value: 'body.icon',
      format: 'image',
      description: 'Only present when an icon URL was sent.',
    },
    {
      key: 'actions',
      label: 'Action Buttons',
      value: 'body.actions',
      labelKey: 'label',
      description: 'Only present when action buttons were sent.',
      listItems: [
        { key: 'id', label: 'Action ID' },
        { key: 'action', label: 'Type', description: 'One of "view", "http" or "broadcast".' },
        { key: 'label', label: 'Label' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'clear', label: 'Clear Notification', format: 'boolean' },
      ],
    },
  ],
};
