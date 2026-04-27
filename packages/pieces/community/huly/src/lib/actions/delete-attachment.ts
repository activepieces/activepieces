import { createAction, Property } from "@activepieces/pieces-framework";
import { deleteAttachment } from "@hulymcp/huly/operations/attachments.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const deleteAttachmentAction = createAction({
  auth: hulyAuth,
  name: "delete_attachment",
  displayName: "Delete Attachment",
  description: "Delete an attachment from Huly",
  props: {
    attachment_id: Property.ShortText({
      displayName: "Attachment ID",
      description: "ID of the attachment to delete (from list_attachments output)",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      deleteAttachment({ attachmentId: context.propsValue.attachment_id })
    );
    return { attachment_id: result.attachmentId, deleted: result.deleted };
  },
});
