/**
 * New Channel Message trigger — fires when a new message is posted in a channel.
 */
import {
  createTrigger,
  TriggerStrategy,
} from "@activepieces/pieces-framework";
import { DedupeStrategy, pollingHelper } from "@activepieces/pieces-common";
import type { Polling } from "@activepieces/pieces-common";
import { listChannelMessages } from "@hulymcp/huly/operations/channels.js";

import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";
import { channelDropdown } from "../common/props";

const polling: Polling<
  { url: string; email: string; password: string; workspace: string },
  { channel: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue }) {
    const result = await withHulyClient(
      auth,
      listChannelMessages({ channel: propsValue.channel, limit: 50 })
    );
    return result.messages.map((m) => ({
      epochMilliSeconds: m.createdOn ?? m.modifiedOn ?? Date.now(),
      data: {
        id: m.id,
        body: m.body,
        sender: m.sender ?? null,
        sender_id: m.senderId ?? null,
        created_on: m.createdOn ?? null,
        modified_on: m.modifiedOn ?? null,
        replies: m.replies ?? 0,
      },
    }));
  },
};

export const newChannelMessageTrigger = createTrigger({
  auth: hulyAuth,
  name: "new_channel_message",
  displayName: "New Channel Message",
  description: "Triggers when a new message is posted in a Huly channel",
  type: TriggerStrategy.POLLING,
  props: {
    channel: channelDropdown,
  },
  sampleData: {
    id: "msg-abc123",
    body: "Hello team!",
    sender: "John Doe",
    sender_id: null,
    created_on: 1710947000000,
    modified_on: 1710947000000,
    replies: 0,
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
