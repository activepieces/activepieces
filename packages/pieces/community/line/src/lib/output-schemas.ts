import { OutputSchema } from '@activepieces/pieces-framework';

export const newMessageTriggerOutputSchema: OutputSchema = {
  itemLabel: 'Message from {source.userId}',
  fields: [
    {
      key: 'events',
      label: 'Events',
      value: '',
      listItems: [
        { key: 'type', label: 'Event Type' },
        { key: 'mode', label: 'Mode' },
        { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
        { key: 'replyToken', label: 'Reply Token' },
        { key: 'webhookEventId', label: 'Webhook Event ID' },
        {
          key: 'source', label: 'Source',
          children: [
            { key: 'type', label: 'Source Type' },
            { key: 'userId', label: 'User ID' },
            { key: 'groupId', label: 'Group ID' },
            { key: 'roomId', label: 'Room ID' },
          ],
        },
        {
          key: 'deliveryContext', label: 'Delivery Context',
          children: [
            { key: 'isRedelivery', label: 'Is Redelivery', format: 'boolean' },
          ],
        },
        { key: 'message', label: 'Message' },
      ],
    },
  ],
};
