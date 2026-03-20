import { createAction, Property } from "@activepieces/pieces-framework";
import { listActivity } from "@hulymcp/huly/operations/activity.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listActivityAction = createAction({
  auth: hulyAuth,
  name: "list_activity",
  displayName: "List Activity",
  description: "List activity messages on a Huly object",
  props: {
    object_id: Property.ShortText({
      displayName: "Object ID",
      description: "ID of the object to list activity for",
      required: true,
    }),
    object_class: Property.StaticDropdown<string, true>({
      displayName: "Object Type",
      description: "Type of the Huly object",
      required: true,
      options: {
        options: [
          { label: "Issue", value: "tracker:class:Issue" },
          { label: "Document", value: "document:class:Document" },
          { label: "Channel Message", value: "chunter:class:ChunterMessage" },
          { label: "Card", value: "card:class:Card" },
          { label: "Person", value: "contact:class:Person" },
          { label: "Organization", value: "contact:class:Organization" },
        ],
      },
    }),
  },
  async run(context) {
    const messages = await withHulyClient(
      context.auth,
      listActivity({
        objectId: context.propsValue.object_id,
        objectClass: context.propsValue.object_class,
      })
    );
    return messages.map((m) => ({
      id: m.id,
      modified_by: m.modifiedBy ?? null,
      modified_on: m.modifiedOn ?? null,
      is_pinned: m.isPinned ?? false,
      replies: m.replies ?? 0,
      reactions: m.reactions ?? 0,
      action: m.action ?? null,
      message: m.message ?? null,
    }));
  },
});
