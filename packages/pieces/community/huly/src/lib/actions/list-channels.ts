import { createAction } from "@activepieces/pieces-framework";
import { listChannels } from "@hulymcp/huly/operations/channels.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listChannelsAction = createAction({
  auth: hulyAuth, name: "list_channels", displayName: "List Channels",
  description: "List channels in your Huly workspace",
  props: {},
  async run(context) {
    const channels = await withHulyClient(context.auth, listChannels({}));
    return channels.map((c) => ({
      id: c.id, name: c.name, topic: c.topic ?? null, private: c.private,
      archived: c.archived, members: c.members ?? 0, messages: c.messages ?? 0,
      modified_on: c.modifiedOn ?? null,
    }));
  },
});
