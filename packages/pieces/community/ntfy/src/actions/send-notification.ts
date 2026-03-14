import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendNotification = createAction({
  name: 'send_notification',
  auth: true, // Requires the piece auth to be configured (if any) or simply skipped if auth is None.
  requireAuth: false,
  displayName: 'Send Notification',
  description: 'Send a push notification to a ntfy.sh topic',
  props: {
    topic: Property.ShortText({
      displayName: 'Topic',
      description: 'The ntfy topic to send the message to (e.g., my_alerts)',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The body of the notification message',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the notification',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Message priority (1-5)',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Min (1)', value: 1 },
          { label: 'Low (2)', value: 2 },
          { label: 'Default (3)', value: 3 },
          { label: 'High (4)', value: 4 },
          { label: 'Max (5)', value: 5 },
        ],
      },
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated list of tags or emojis (e.g., warning, skull)',
      required: false,
    }),
  },
  async run(context) {
    const { topic, message, title, priority, tags } = context.propsValue;

    const headers: Record<string, string> = {
      'Content-Type': 'text/plain',
    };
    
    if (title) headers['Title'] = title;
    if (priority) headers['Priority'] = priority.toString();
    if (tags) headers['Tags'] = tags;

    const response = await httpClient.sendRequest<string>({
      method: HttpMethod.POST,
      url: `https://ntfy.sh/${topic}`,
      headers,
      body: message,
    });

    return response.body;
  },
});
