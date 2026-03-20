import { createAction, Property } from "@activepieces/pieces-framework";
import { sendChannelMessage } from "@hulymcp/huly/operations/channels.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { channelDropdown } from "../common/props";

export const sendChannelMessageAction = createAction({
  auth: hulyAuth, name: "send_channel_message", displayName: "Send Channel Message",
  description: "Send a message to a Huly channel",
  props: {
    channel: channelDropdown,
    body: Property.LongText({ displayName: "Message", description: "Message body (markdown supported)", required: true }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, sendChannelMessage({
      channel: context.propsValue.channel,
      body: context.propsValue.body,
    }));
    return { id: result.id, channel_id: result.channelId };
  },
});
