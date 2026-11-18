import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { markSeenOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';

export const markNotificationsSeen = createAction({
  auth: blueskyAuth,
  name: 'mark_notifications_seen',
  classification: 'WRITE',
  displayName: 'Mark Notifications as Seen',
  description: 'Mark all notifications up to a time as seen',
  audience: 'both',
  outputSchema: markSeenOutputSchema,
  aiMetadata: {
    description:
      'Marks every notification of the connected Bluesky account up to a given time (default now) as seen, which resets the unread count in the Bluesky app. Use after processing List Notifications. Idempotent: repeating it with the same time changes nothing.',
    idempotent: true,
  },
  props: {
    seenAt: Property.DateTime({
      displayName: 'Seen Up To',
      description: 'Notifications up to this time are marked as seen. Leave empty for now.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const time = propsValue.seenAt ? Date.parse(propsValue.seenAt) : Date.now();
    if (Number.isNaN(time)) {
      throw new Error('Seen Up To is not a valid date.');
    }
    const seenAt = new Date(time).toISOString();
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'mark notifications as seen',
      fn: async (agent) => {
        await agent.updateSeenNotifications(seenAt);
        return { seenAt };
      },
    });
  },
});
