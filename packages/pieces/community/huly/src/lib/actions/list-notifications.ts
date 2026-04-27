import { createAction } from "@activepieces/pieces-framework";
import { listNotifications } from "@hulymcp/huly/operations/notifications.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listNotificationsAction = createAction({
  auth: hulyAuth,
  name: "list_notifications",
  displayName: "List Notifications",
  description: "List notifications in your Huly workspace",
  props: {},
  async run(context) {
    const notifications = await withHulyClient(
      context.auth,
      listNotifications({})
    );
    return notifications.map((n) => ({
      id: n.id,
      is_viewed: n.isViewed,
      archived: n.archived,
      title: n.title ?? null,
      body: n.body ?? null,
      created_on: n.createdOn ?? null,
      modified_on: n.modifiedOn ?? null,
    }));
  },
});
