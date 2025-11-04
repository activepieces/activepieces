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
  _id: string;
  type?: string;
  createdAt: string;
};

const polling: Polling<
  PiecePropValueSchema<typeof AgentXAuth>,
  { agentId?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { agentId } = propsValue;

    if (!agentId) {
      return []; 
    }

    try {
      const conversations = (await makeRequest(
        auth,
        HttpMethod.GET,
        `/agents/${agentId}/conversations`
      )) as Conversation[];

      const sortedConversations = conversations.sort((a, b) => 
        dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
      );

      return sortedConversations.map((conv) => ({
        epochMilliSeconds: dayjs(conv.createdAt).valueOf(),
        data: conv,
      }));
    } catch (error) {
      console.error(`Error fetching conversations for agent ${agentId}:`, error);
      throw error;
    }
  },
};

export const newConversation = createTrigger({
  auth: AgentXAuth,
  name: "new_conversation",
  displayName: "New Conversation",
  description: "Triggers when a new conversation begins with a specific Agent. Only detects conversations created after the trigger is enabled.",
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
