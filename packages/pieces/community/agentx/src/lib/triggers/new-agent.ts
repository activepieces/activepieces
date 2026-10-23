import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { agentxAuth } from '../auth';
import { agentxApi } from '../common/api';
import type { AgentxAuthValue } from '../common/types';

const polling: Polling<AgentxAuthValue, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const agents = await agentxApi.listAgents({ auth });

    const sortedAgents = agents.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

    return sortedAgents.map((agent) => ({
      epochMilliSeconds: dayjs(agent.createdAt).valueOf(),
      data: agent,
    }));
  },
};

export const newAgentTrigger = createTrigger({
  auth: agentxAuth,
  name: 'new_agent',
  classification: 'READ',
  displayName: 'New Agent',
  description: 'Triggers when a new AgentX agent is created.',
  aiMetadata: {
    description: 'Fires when a new agent is created on the AgentX account, emitting the newly created agent. Polls periodically and only surfaces agents created after the trigger was enabled.',
  },
  props: {},
  sampleData: {
    _id: 'agt_1234567890abcdef',
    name: 'Customer Support Bot',
    created_at: '2025-09-08T10:00:00Z',
  },
  type: TriggerStrategy.POLLING,
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
