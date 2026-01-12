import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { lettaAuth } from '../common/auth';
import { getLettaClient } from '../common/client';
import type {
  AgentState,
  AgentListParams,
} from '../common/types';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof lettaAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const client = getLettaClient(auth.props);

    const query: AgentListParams = {
      limit: 100,
    };

    const agentsPage = await client.agents.list(query);

    const agents: AgentState[] = [];
    for await (const agent of agentsPage) {
      if (agent.created_at) {
        const createdAtEpoch = Date.parse(agent.created_at);

        if (createdAtEpoch > lastFetchEpochMS) {
          agents.push(agent);
        }
      }
    }

    return agents
      .sort((a, b) => {
        const aTime = a.created_at ? Date.parse(a.created_at) : 0;
        const bTime = b.created_at ? Date.parse(b.created_at) : 0;
        return bTime - aTime;
      })
      .map((agent) => ({
        epochMilliSeconds: agent.created_at
          ? Date.parse(agent.created_at)
          : Date.now(),
        data: agent,
      }));
  },
};

export const newAgent = createTrigger({
  auth: lettaAuth,
  name: 'newAgent',
  displayName: 'New Agent',
  description: 'Triggers when a new agent is created',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {},
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});

