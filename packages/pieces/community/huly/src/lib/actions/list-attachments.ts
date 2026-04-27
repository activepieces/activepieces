import { createAction, Property } from "@activepieces/pieces-framework";
import { listAttachments } from "@hulymcp/huly/operations/attachments.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listAttachmentsAction = createAction({
  auth: hulyAuth,
  name: "list_attachments",
  displayName: "List Attachments",
  description: "List attachments on a Huly object (issue, document, etc.)",
  props: {
    object_id: Property.ShortText({
      displayName: "Object ID",
      description: "ID of the object to list attachments for (issue ID, document ID, etc.)",
      required: true,
    }),
    object_class: Property.ShortText({
      displayName: "Object Class",
      description: "Huly class of the object (e.g., tracker:class:Issue)",
      required: true,
    }),
  },
  async run(context) {
    const attachments = await withHulyClient(
      context.auth,
      listAttachments({
        objectId: context.propsValue.object_id,
        objectClass: context.propsValue.object_class,
      })
    );
    return attachments.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      size: a.size,
      pinned: a.pinned ?? false,
      description: a.description ?? null,
      url: a.url ?? null,
      modified_on: a.modifiedOn ?? null,
    }));
  },
});
