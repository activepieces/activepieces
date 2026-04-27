import { createAction, Property } from "@activepieces/pieces-framework";
import { listThreadReplies } from "@hulymcp/huly/operations/threads.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { channelDropdown } from "../common/props";

export const listThreadRepliesAction = createAction({
  auth: hulyAuth, name: "list_thread_replies", displayName: "List Thread Replies",
  description: "List replies in a message thread",
  props: {
    channel: channelDropdown,
    message_id: Property.ShortText({ displayName: "Message ID", description: "ID of the parent message (from list_channel_messages output)", required: true }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, listThreadReplies({
      channel: context.propsValue.channel,
      messageId: context.propsValue.message_id,
    }));
    return result.replies.map((r) => ({
      id: r.id, body: r.body, sender: r.sender ?? null, sender_id: r.senderId ?? null,
      created_on: r.createdOn ?? null, modified_on: r.modifiedOn ?? null,
    }));
  },
});
