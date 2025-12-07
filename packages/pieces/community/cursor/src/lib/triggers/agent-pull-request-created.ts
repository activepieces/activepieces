import { createTrigger, TriggerStrategy, PiecePropValueSchema, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import { cursorAuth } from '../common/auth';
import { makeCursorRequest } from '../common/client';

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

interface ListAgentsResponse {
  agents: Agent[];
  nextCursor?: string;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof cursorAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS, store }) => {
    const isTest = lastFetchEpochMS === 0;
    const limit = isTest ? 5 : 100;

    try {
      const response = await makeCursorRequest<ListAgentsResponse>(
        auth,
        '/v0/agents',
        HttpMethod.GET,
        undefined,
        { limit }
      );

      if (!response.agents || response.agents.length === 0) {
        return [];
      }

      const storedAgentsWithPRs = await store.get<string>('agents_with_prs');
      const agentsWithPRsSet = new Set<string>(
        storedAgentsWithPRs ? JSON.parse(storedAgentsWithPRs) : []
      );

      const newPRs: Array<{ epochMilliSeconds: number; data: Agent }> = [];
      const updatedAgentsWithPRs = new Set<string>(agentsWithPRsSet);

      for (const agent of response.agents) {
        if (agent.target?.prUrl) {
          if (!agentsWithPRsSet.has(agent.id)) {
            const epochMilliSeconds = Date.parse(agent.createdAt);
            newPRs.push({
              epochMilliSeconds,
              data: agent,
            });
          }
          updatedAgentsWithPRs.add(agent.id);
        } else {
          updatedAgentsWithPRs.delete(agent.id);
        }
      }

      await store.put('agents_with_prs', JSON.stringify(Array.from(updatedAgentsWithPRs)));

      if (isTest) {
        return newPRs;
      }

      return newPRs.filter((item) => item.epochMilliSeconds > lastFetchEpochMS);
    } catch (error) {
      return [];
    }
  },
};

export const agentPullRequestCreatedTrigger = createTrigger({
  auth: cursorAuth,
  name: 'agent_pull_request_created',
  displayName: 'Agent Pull Request Created',
  description: 'Triggers when a background agent creates a pull request',
  type: TriggerStrategy.POLLING,
  props: {},
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
      autoCreatePr: true,
      openAsCursorGithubApp: false,
      skipReviewerRequest: false,
    },
    summary: 'Added README.md with installation instructions and usage examples',
    createdAt: '2024-01-15T10:30:00Z',
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await store.put('agents_with_prs', JSON.stringify([]));
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await store.delete('agents_with_prs');
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

