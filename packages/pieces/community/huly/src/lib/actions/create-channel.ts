import { createAction, Property } from "@activepieces/pieces-framework";
import { createChannel } from "@hulymcp/huly/operations/channels.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createChannelAction = createAction({
  auth: hulyAuth, name: "create_channel", displayName: "Create Channel",
  description: "Create a new channel in your Huly workspace",
  props: {
    name: Property.ShortText({ displayName: "Channel Name", description: "Name for the channel", required: true }),
    topic: Property.ShortText({ displayName: "Topic", description: "Channel topic/description", required: false }),
    is_private: Property.Checkbox({ displayName: "Private", description: "Whether the channel is private", required: false, defaultValue: false }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, createChannel({
      name: context.propsValue.name,
      topic: context.propsValue.topic || undefined,
      private: context.propsValue.is_private ?? false,
    }));
    return { id: result.id, name: result.name };
  },
});
