import { createAction } from "@activepieces/pieces-framework";
import { deleteChannel } from "@hulymcp/huly/operations/channels.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { channelDropdown } from "../common/props";

export const deleteChannelAction = createAction({
  auth: hulyAuth, name: "delete_channel", displayName: "Delete Channel",
  description: "Delete a channel from your Huly workspace",
  props: { channel: channelDropdown },
  async run(context) {
    const result = await withHulyClient(context.auth, deleteChannel({ channel: context.propsValue.channel }));
    return { id: result.id, deleted: result.deleted };
  },
});
