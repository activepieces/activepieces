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
      const agents = await listAgents({ auth, limit });
      if (agents.length === 0) {
        return [];
      }

      const storedAgentsWithPRs = await store.get<string>(AGENTS_WITH_PRS_KEY);
      const agentsWithPRsSet = new Set<string>(
        storedAgentsWithPRs ? JSON.parse(storedAgentsWithPRs) : []
      );
      const detectedAt = Date.now();
      const newPRs: Array<{ epochMilliSeconds: number; data: Agent }> = [];
      const updatedAgentsWithPRs = new Set<string>(agentsWithPRsSet);

      for (const agent of agents) {
        if (agent.target?.prUrl) {
          if (!agentsWithPRsSet.has(agent.id)) {
            newPRs.push({
              epochMilliSeconds: isTest ? Date.parse(agent.createdAt) : detectedAt,
              data: agent,
            });
          }
          updatedAgentsWithPRs.add(agent.id);
        } else {
          updatedAgentsWithPRs.delete(agent.id);
        }
      }

      await store.put(AGENTS_WITH_PRS_KEY, JSON.stringify(Array.from(updatedAgentsWithPRs)));
      return newPRs;
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
  aiMetadata: {
    description: 'Fires when a Cursor cloud agent first produces a pull request for its work, detected by polling agents for a newly populated PR URL.',
  },
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
    const agents = await listAgents({ auth: context.auth, limit: 100 });
    const agentsWithPRs = agents.filter((agent) => agent.target?.prUrl).map((agent) => agent.id);
    await context.store.put(AGENTS_WITH_PRS_KEY, JSON.stringify(agentsWithPRs));
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await context.store.delete(AGENTS_WITH_PRS_KEY);
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

async function listAgents({ auth, limit }: { auth: AppConnectionValueForAuthProperty<typeof cursorAuth>; limit: number }): Promise<Agent[]> {
  const response = await makeCursorRequest<ListAgentsResponse>(
    auth,
    '/v0/agents',
    HttpMethod.GET,
    undefined,
    { limit }
  );
  return response.agents ?? [];
}

const AGENTS_WITH_PRS_KEY = 'agents_with_prs';
