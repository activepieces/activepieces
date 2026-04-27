import { createAction } from "@activepieces/pieces-framework";
import { getUnreadNotificationCount } from "@hulymcp/huly/operations/notifications.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const getUnreadNotificationCountAction = createAction({
  auth: hulyAuth,
  name: "get_unread_notification_count",
  displayName: "Get Unread Notification Count",
  description: "Get the number of unread notifications",
  props: {},
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      getUnreadNotificationCount()
    );
    return { count: result.count };
  },
});
