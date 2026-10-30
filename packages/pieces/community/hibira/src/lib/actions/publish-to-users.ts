import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient, splitList } from '../common/client';
import { notificationPayload, notificationProps } from '../common/push';

export const publishToUsers = createAction({
  auth: hibiraAuth,
  name: 'publish_to_users',
  displayName: 'Send Push Notification to Users',
  description: 'Sends a push notification to every device of one or more signed-in users.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a push notification through Hibira Push (Beams-compatible) to all devices of the given user IDs. Needs the Push Instance ID and Secret Key in the connection.',
    idempotent: false,
  },
  props: {
    userIds: Property.ShortText({
      displayName: 'User IDs',
      description: 'One user ID, or several separated by commas (up to 1,000).',
      required: true,
    }),
    ...notificationProps,
  },
  async run({ auth, propsValue }) {
    const users = splitList(propsValue.userIds);
    if (users.length === 0) {
      throw new Error('Enter at least one user ID.');
    }
    return hibiraClient.push(auth, {
      method: 'POST',
      path: '/publish_api/v1/instances/{instance}/publishes/users',
      body: { ...notificationPayload({ ...propsValue, platforms: propsValue.platforms as string[] | undefined }), users },
    });
  },
});
