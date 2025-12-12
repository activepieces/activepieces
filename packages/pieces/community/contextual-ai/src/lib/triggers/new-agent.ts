import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { contextualAiAuth } from '../../index';
import { ContextualAI } from 'contextual-client';
import type { Agent } from 'contextual-client/resources/agents';

const polling: Polling<AppConnectionValueForAuthProperty<typeof contextualAiAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const { apiKey, baseUrl } = auth.props;
    const client = new ContextualAI({
      apiKey: apiKey,
      baseURL: baseUrl || 'https://api.contextual.ai/v1',
    });

    const allAgents: Agent[] = [];
    for await (const agent of client.agents.list()) {
      allAgents.push(agent);
    }

    const newAgents = lastFetchEpochMS
      ? allAgents.filter(agent => {
          return true;
        })
      : allAgents;

    const items = newAgents.map((agent: Agent) => ({
      epochMilliSeconds: Date.now(),
      data: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
      },
    }));

    return items;
  },
};

export const newAgentTrigger = createTrigger({
  auth: contextualAiAuth,
  name: 'new_agent',
  displayName: 'New Agent',
  description: 'Triggers when a new Contextual AI agent is created',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'agent_123',
    name: 'Sample Agent',
    description: 'A sample agent for testing',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
