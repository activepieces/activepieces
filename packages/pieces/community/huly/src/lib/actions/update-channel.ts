import { createAction, Property } from "@activepieces/pieces-framework";
import { updateChannel } from "@hulymcp/huly/operations/channels.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { channelDropdown } from "../common/props";

export const updateChannelAction = createAction({
  auth: hulyAuth, name: "update_channel", displayName: "Update Channel",
  description: "Update a channel's name or topic",
  props: {
    channel: channelDropdown,
    name: Property.ShortText({ displayName: "New Name", description: "New channel name (leave empty to keep current)", required: false }),
    topic: Property.ShortText({ displayName: "New Topic", description: "New channel topic (leave empty to keep current)", required: false }),
  },
  async run(context) {
    const result = await withHulyClient(context.auth, updateChannel({
      channel: context.propsValue.channel,
      name: context.propsValue.name || undefined,
      topic: context.propsValue.topic || undefined,
    }));
    return { id: result.id, updated: result.updated };
  },
});
