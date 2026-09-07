import { OutputSchema } from '@activepieces/pieces-framework';

export const sendNotificationActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'status',
      label: 'Status',
      value: 'body.status',
      format: 'number',
      description: '1 when Pushover accepted the notification. Any other value means it was rejected.',
    },
    {
      key: 'request',
      label: 'Request ID',
      value: 'body.request',
      description: 'Pushover\'s identifier for this request, worth quoting when reporting a delivery problem.',
    },
    {
      key: 'receipt',
      label: 'Receipt',
      value: 'body.receipt',
      description:
        'Only returned at emergency priority (2). Use it to check whether the notification was acknowledged.',
    },
  ],
};
