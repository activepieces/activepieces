import { createAction, Property } from "@activepieces/pieces-framework";
import { updateThreadReply } from "@hulymcp/huly/operations/threads.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { channelDropdown } from "../common/props";

export const updateThreadReplyAction = createAction({
  auth: hulyAuth, name: "update_thread_reply", displayName: "Update Thread Reply",
  description: "Update a thread reply",
  props: {
    channel: channelDropdown,
    message_id: Property.ShortText({ displayName: "Message ID", description: "ID of the parent message", required: true }),
    reply_id: Property.ShortText({ displayName: "Reply ID", description: "ID of the reply to update", required: true }),
    body: Property.LongText({ displayName: "New Body", description: "New reply body (markdown supported)", required: true }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, updateThreadReply({
      channel: context.propsValue.channel,
      messageId: context.propsValue.message_id,
      replyId: context.propsValue.reply_id,
      body: context.propsValue.body,
    }));
    return { id: result.id, updated: result.updated };
  },
});
