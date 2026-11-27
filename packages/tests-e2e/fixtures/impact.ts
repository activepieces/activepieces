import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession, SeededFlow } from './api';
import { test as base } from './index';
import { publishVersions } from './publish-versions';

export const test = base.extend<{ impact: Impact }>({
  impact: async ({ request, session }, use) => {
    await use({
      setTimeSavedPerRun: async ({ flowId, seconds }) => {
        await e2eApi.callApi({
          request,
          session,
          method: 'POST',
          path: `/api/v1/flows/${flowId}`,
          data: { type: 'UPDATE_MINUTES_SAVED', request: { timeSavedPerRun: seconds } },
        });
      },
      runFlow: async ({ flow, count, session: projectSession }) => {
        const flowSession = projectSession ?? session;
        await Promise.all(Array.from({ length: count }, () => callWebhook({ request, url: flow.webhookUrl })));
        await expect.poll(() => publishVersions.countRuns({ request, session: flowSession, flowId: flow.flowId }), {
          message: `${count} runs of flow ${flow.flowId}`,
          timeout: RUNS_TIMEOUT_MS,
        }).toBe(count);
      },
      refresh: ({ session: userSession }) => e2eApi.callApi<ImpactReport>({ request, session: userSession, method: 'POST', path: '/api/v1/analytics/refresh' }),
      read: () => e2eApi.callApi<ImpactReport>({ request, session, method: 'GET', path: '/api/v1/analytics' }),
      runsOf: ({ report, flowId }) => report.runs.filter((run) => run.flowId === flowId).reduce((total, run) => total + run.runs, 0),
    });
  },
});

export { expect } from '@playwright/test';

async function callWebhook({ request, url }: { request: APIRequestContext; url: string }) {
  const response = await request.post(url);
  if (!response.ok()) {
    throw new Error(`Calling the webhook ${url} failed with ${response.status()}: ${await response.text()}`);
  }
}

const RUNS_TIMEOUT_MS = 60_000;

export type ImpactReport = {
  flows: { flowId: string; projectId: string; timeSavedPerRun: number | null }[];
  runs: { flowId: string; day: string; runs: number }[];
};

type Impact = {
  setTimeSavedPerRun: (params: { flowId: string; seconds: number }) => Promise<void>;
  runFlow: (params: { flow: SeededFlow; count: number; session?: E2eSession }) => Promise<void>;
  refresh: (params: { session: E2eSession }) => Promise<ImpactReport>;
  read: () => Promise<ImpactReport>;
  runsOf: (params: { report: ImpactReport; flowId: string }) => number;
};
