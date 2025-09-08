import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from "@activepieces/pieces-framework";
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from "@activepieces/pieces-common";
import dayjs from "dayjs";
import { makeRequest } from "../common/client";
import { AgentXAuth } from "../common/auth";
import { AgentIdDropdown } from "../common/dropdown";


type Conversation = {
  id: string;
  type?: string;
  created_at: string;
};

const polling: Polling<
  PiecePropValueSchema<typeof AgentXAuth>,
  { agentId?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { agentId } = propsValue;

    if (!agentId) {
      return []; // no agent selected, nothing to poll
    }

    const conversations = (await makeRequest(
      auth,
      HttpMethod.GET,
      `/agents/${agentId}/conversations`
    )) as Conversation[];

    return conversations.map((conv) => ({
      epochMilliSeconds: dayjs(conv.created_at).valueOf(),
      data: conv,
    }));
  },
};

export const newConversation = createTrigger({
  auth: AgentXAuth,
  name: "new_conversation",
  displayName: "New Conversation",
  description: "Triggers when a new conversation begins with a specific Agent.",
  type: TriggerStrategy.POLLING,

  props: {
    agentId: AgentIdDropdown,
  },

  sampleData: {
    id: "conv_1234567890abcdef",
    type: "chat",
    created_at: "2025-09-08T11:45:00Z",
  },

  async test(context) {
    return await pollingHelper.test(polling, context);
  },

  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
