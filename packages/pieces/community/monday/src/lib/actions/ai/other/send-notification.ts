import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { sendNotificationActionOutputSchema } from '../../../output-schemas';

export const sendNotificationAction = createAction({
  auth: mondayAuth,
  name: 'monday_send_notification',
  classification: 'WRITE',
  displayName: 'Send Notification',
  description: 'Sends a bell notification to a monday.com user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Send a bell notification (and possibly an email, per the recipient\'s preferences) to one monday.com user, linked to an item or board (target type Project) or to an update or reply (target type Post). Use to alert a specific person; to comment on an item for everyone use Post Item Update. monday.com returns no notification ID. Each call sends another notification.',
    idempotent: false,
  },
  outputSchema: sendNotificationActionOutputSchema,
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The recipient. Resolve it with List Users.',
      required: true,
    }),
    target_type: Property.StaticDropdown({
      displayName: 'Target Type',
      required: true,
      defaultValue: 'Project',
      options: {
        options: [
          { label: 'Item or board', value: 'Project' },
          { label: 'Update or reply', value: 'Post' },
        ],
      },
    }),
    target_id: Property.ShortText({
      displayName: 'Target ID',
      description: 'An item or board ID for "Item or board", or an update/reply ID for "Update or reply".',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
  },
  async run(context) {
    const { user_id, target_type, target_id, text } = context.propsValue;

    const data = await makeClient(context.auth).query<{ create_notification: { text: string | null } | null }>({
      query: `mutation ($userId: ID!, $targetId: ID!, $targetType: NotificationTargetType!, $text: String!) {
        create_notification(user_id: $userId, target_id: $targetId, target_type: $targetType, text: $text) {
          text
        }
      }`,
      variables: {
        userId: user_id,
        targetId: target_id,
        targetType: target_type,
        text,
      },
    });

    return {
      sent: true,
      user_id,
      target_type,
      target_id,
      text: data.create_notification?.text ?? text,
    };
  },
});
