import { createAction, Property } from "@activepieces/pieces-framework";
import { deleteThreadReply } from "@hulymcp/huly/operations/threads.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { channelDropdown } from "../common/props";

export const deleteThreadReplyAction = createAction({
  auth: hulyAuth, name: "delete_thread_reply", displayName: "Delete Thread Reply",
  description: "Delete a thread reply",
  props: {
    channel: channelDropdown,
    message_id: Property.ShortText({ displayName: "Message ID", description: "ID of the parent message", required: true }),
    reply_id: Property.ShortText({ displayName: "Reply ID", description: "ID of the reply to delete", required: true }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, deleteThreadReply({
      channel: context.propsValue.channel,
      messageId: context.propsValue.message_id,
      replyId: context.propsValue.reply_id,
    }));
    return { id: result.id, deleted: result.deleted };
  },
});
