import {createTrigger,TriggerStrategy,PiecePropValueSchema,} from "@activepieces/pieces-framework";
import {DedupeStrategy,Polling,pollingHelper,} from "@activepieces/pieces-common";
import dayjs from "dayjs";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { AgentXAuth } from "../common/auth";

type Agent = {
  id: string;
  name?: string;
  createdAt: string;
};

const polling: Polling<
  PiecePropValueSchema<typeof AgentXAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const agents = (await makeRequest(auth, HttpMethod.GET, "/agents")) as Agent[];
    
    const sortedAgents = agents.sort((a, b) => 
      dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
    );

    return sortedAgents.map((agent) => ({
      epochMilliSeconds: dayjs(agent.createdAt).valueOf(),
      data: agent,
    }));
  },
};

export const newAgent = createTrigger({
  auth: AgentXAuth,
  name: "new_agent",
  displayName: "New Agent",
  description: "Triggers when a new AgentX agent is created.",
  props: {},
  sampleData: {
    _id: "agt_1234567890abcdef",
    name: "Customer Support Bot",
    created_at: "2025-09-08T10:00:00Z",
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.test(polling, context);
  },

  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
