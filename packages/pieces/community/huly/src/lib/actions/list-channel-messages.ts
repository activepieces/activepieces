import { createAction } from "@activepieces/pieces-framework";
import { listChannelMessages } from "@hulymcp/huly/operations/channels.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { channelDropdown } from "../common/props";

export const listChannelMessagesAction = createAction({
  auth: hulyAuth, name: "list_channel_messages", displayName: "List Channel Messages",
  description: "List messages in a Huly channel",
  props: { channel: channelDropdown },
  async run(context) {
    const result = await withHulyClient(context.auth, listChannelMessages({ channel: context.propsValue.channel }));
    return result.messages.map((m) => ({
      id: m.id, body: m.body, sender: m.sender ?? null, sender_id: m.senderId ?? null,
      created_on: m.createdOn ?? null, modified_on: m.modifiedOn ?? null, replies: m.replies ?? 0,
    }));
  },
});
