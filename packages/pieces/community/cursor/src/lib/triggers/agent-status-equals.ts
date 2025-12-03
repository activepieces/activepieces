import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { cursorAuth } from '../common/auth';
import { makeCursorRequest } from '../common/client';
import { agentDropdown } from '../common/props';

interface Agent {
  id: string;
  name: string;
  status: string;
  source?: {
    repository?: string;
    ref?: string;
  };
  target?: {
    branchName?: string;
    url?: string;
    prUrl?: string;
    autoCreatePr?: boolean;
    openAsCursorGithubApp?: boolean;
    skipReviewerRequest?: boolean;
  };
  summary?: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { label: 'CREATING', value: 'CREATING' },
  { label: 'RUNNING', value: 'RUNNING' },
  { label: 'FINISHED', value: 'FINISHED' },
  { label: 'FAILED', value: 'FAILED' },
];

const polling: Polling< AppConnectionValueForAuthProperty<typeof cursorAuth>, 
  { agentId: string; status: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, store }) => {
    const { agentId, status: targetStatus } = propsValue;
    const storeKey = `agent_status_${agentId}`;

    try {
      const agent = await makeCursorRequest<Agent>(
        auth,
        `/v0/agents/${agentId}`,
        HttpMethod.GET
      );

      const lastStatus = await store.get<string>(storeKey);

      if (agent.status === targetStatus && agent.status !== lastStatus) {
        await store.put(storeKey, agent.status);

        return [
          {
            epochMilliSeconds: Date.parse(agent.createdAt),
            data: agent,
          },
        ];
      }

      if (agent.status !== lastStatus) {
        await store.put(storeKey, agent.status);
      }

      return [];
    } catch (error) {
      return [];
    }
  },
};

export const agentStatusEqualsTrigger = createTrigger({
  auth: cursorAuth,
  name: 'agent_status_equals',
  displayName: 'Agent Status Equals',
  description: 'Triggers when a Cursor agent has the specified status (e.g., "FINISHED", "FAILED")',
  type: TriggerStrategy.POLLING,
  props: {
    agentId: agentDropdown,
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status to watch for',
      required: true,
      options: {
        options: STATUS_OPTIONS,
      },
    }),
  },
  sampleData: {
    id: 'bc_abc123',
    name: 'Add README Documentation',
    status: 'FINISHED',
    source: {
      repository: 'https://github.com/your-org/your-repo',
      ref: 'main',
    },
    target: {
      branchName: 'cursor/add-readme-1234',
      url: 'https://cursor.com/agents?id=bc_abc123',
      prUrl: 'https://github.com/your-org/your-repo/pull/1234',
      autoCreatePr: false,
      openAsCursorGithubApp: false,
      skipReviewerRequest: false,
    },
    summary: 'Added README.md with installation instructions and usage examples',
    createdAt: '2024-01-15T10:30:00Z',
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    const { agentId } = propsValue;
    const storeKey = `agent_status_${agentId}`;

    try {
      const agent = await makeCursorRequest<Agent>(
        auth,
        `/v0/agents/${agentId}`,
        HttpMethod.GET
      );
      await store.put(storeKey, agent.status);
    } catch (error) {
      await store.put(storeKey, null);
    }

    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    const { agentId } = propsValue;
    const storeKey = `agent_status_${agentId}`;

    await store.delete(storeKey);
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async test(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue, files });
  },
  async run(context) {
    const { store, auth, propsValue, files } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue, files });
  },
});

