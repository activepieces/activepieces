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
import { lettaApi } from '../common/client';
import { lettaSchemas } from '../common/schemas';
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
    const client = await lettaApi.getLettaClient({ auth: auth.props });

    const query: AgentListParams = {
      limit: 100,
      order: 'desc',
      order_by: 'created_at',
      include: ['agent.tags'],
    };

    const agentsPage = await lettaApi.callLetta(() => client.agents.list(query));

    const agents: AgentState[] = agentsPage
      .getPaginatedItems()
      .filter((agent) => agent.created_at && Date.parse(agent.created_at) > lastFetchEpochMS);

    return agents
      .sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? ''))
      .map((agent) => ({
        epochMilliSeconds: agent.created_at ? Date.parse(agent.created_at) : Date.now(),
        data: { ...lettaApi.mapAgentSummary(agent), system: agent.system ?? null },
      }));
  },
};

export const newAgent = createTrigger({
  auth: lettaAuth,
  name: 'newAgent',
  classification: 'READ',
  displayName: 'New Agent',
  description: 'Triggers when a new agent is created',
  aiMetadata: {
    description: 'Fires when a new agent is created in the Letta project, emitting a summary of the newly created agent (ID, name, type, model, tags, timestamps, system prompt); secrets and environment variables are never included. Polls the agent list and detects agents whose creation timestamp is later than the last poll.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: lettaSchemas.newAgentTrigger,
  sampleData: {
    id: 'agent-6f0b2a4c-3d1e-4f6a-9b8c-2e5d7a1c4b90',
    name: 'support-assistant',
    agent_type: 'letta_v1_agent',
    model: 'letta/auto',
    embedding: null,
    description: 'Answers customer questions',
    tags: ['support'],
    created_at: '2026-10-29T10:15:00.000Z',
    updated_at: '2026-10-29T10:15:00.000Z',
    last_run_completion: null,
    last_stop_reason: null,
    system: null,
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
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});

