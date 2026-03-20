import { createAction, Property } from "@activepieces/pieces-framework";
import { addThreadReply } from "@hulymcp/huly/operations/threads.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { channelDropdown } from "../common/props";

export const addThreadReplyAction = createAction({
  auth: hulyAuth, name: "add_thread_reply", displayName: "Add Thread Reply",
  description: "Reply to a message in a thread",
  props: {
    channel: channelDropdown,
    message_id: Property.ShortText({ displayName: "Message ID", description: "ID of the parent message to reply to", required: true }),
    body: Property.LongText({ displayName: "Reply", description: "Reply body (markdown supported)", required: true }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, addThreadReply({
      channel: context.propsValue.channel,
      messageId: context.propsValue.message_id,
      body: context.propsValue.body,
    }));
    return { id: result.id, message_id: result.messageId, channel_id: result.channelId };
  },
});
