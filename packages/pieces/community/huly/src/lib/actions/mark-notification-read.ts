import { createAction, Property } from "@activepieces/pieces-framework";
import { markNotificationRead } from "@hulymcp/huly/operations/notifications.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const markNotificationReadAction = createAction({
  auth: hulyAuth,
  name: "mark_notification_read",
  displayName: "Mark Notification Read",
  description: "Mark a notification as read",
  props: {
    notification_id: Property.ShortText({
      displayName: "Notification ID",
      description: "ID of the notification to mark as read",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      markNotificationRead({ notificationId: context.propsValue.notification_id })
    );
    return { id: result.id, marked: result.marked };
  },
});
