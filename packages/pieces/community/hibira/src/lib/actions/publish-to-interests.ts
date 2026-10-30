import { createAction, Property } from '@activepieces/pieces-framework';
import { hibiraAuth } from '../auth';
import { hibiraClient, splitList } from '../common/client';
import { notificationPayload, notificationProps } from '../common/push';

export const publishToInterests = createAction({
  auth: hibiraAuth,
  name: 'publish_to_interests',
  displayName: 'Send Push Notification to Interests',
  description: 'Sends a push notification to every device subscribed to one or more interests (topics).',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a push notification through Hibira Push (Beams-compatible) to all iOS, Android and web devices subscribed to the given interests. Needs the Push Instance ID and Secret Key in the connection.',
    idempotent: false,
  },
  props: {
    interests: Property.ShortText({
      displayName: 'Interests',
      description: 'One interest, or several separated by commas (up to 100).',
      required: true,
    }),
    ...notificationProps,
  },
  async run({ auth, propsValue }) {
    const interests = splitList(propsValue.interests);
    if (interests.length === 0) {
      throw new Error('Enter at least one interest.');
    }
    return hibiraClient.push(auth, {
      method: 'POST',
      path: '/publish_api/v1/instances/{instance}/publishes/interests',
      body: { ...notificationPayload({ ...propsValue, platforms: propsValue.platforms as string[] | undefined }), interests },
    });
  },
});
