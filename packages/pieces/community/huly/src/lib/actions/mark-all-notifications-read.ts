import { createAction } from "@activepieces/pieces-framework";
import { markAllNotificationsRead } from "@hulymcp/huly/operations/notifications.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const markAllNotificationsReadAction = createAction({
  auth: hulyAuth,
  name: "mark_all_notifications_read",
  displayName: "Mark All Notifications Read",
  description: "Mark all notifications as read",
  props: {},
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      markAllNotificationsRead()
    );
    return { count: result.count };
  },
});
