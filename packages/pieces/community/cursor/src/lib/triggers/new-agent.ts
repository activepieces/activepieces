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
  items: async ({ auth, lastFetchEpochMS }) => {
    const isTest = lastFetchEpochMS === 0;
    
    const limit = isTest ? 5 : 100;
    
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

    return response.agents
      .map((agent) => {
        const epochMilliSeconds = Date.parse(agent.createdAt);

        return {
          epochMilliSeconds,
          data: agent,
        };
      })
      .filter((item) => {
        if (isTest) {
          return true;
        }
        return item.epochMilliSeconds > lastFetchEpochMS;
      });
  },
};

export const newAgentTrigger = createTrigger({
  auth: cursorAuth,
  name: 'new_agent',
  displayName: 'New Agent',
  description: 'Triggers when a new Cursor agent is created or when agent status changes',
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
      autoCreatePr: false,
      openAsCursorGithubApp: false,
      skipReviewerRequest: false,
    },
    summary: 'Added README.md with installation instructions and usage examples',
    createdAt: '2024-01-15T10:30:00Z',
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

