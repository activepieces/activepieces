import { expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession, SeededFlow } from './api';
import { test as base } from './index';

export const test = base.extend<{ operations: Operations }>({
  operations: async ({ request, session }, use) => {
    await use({
      callWebhook: async ({ flow }) => {
        const response = await request.post(flow.webhookUrl);
        expect(response.ok(), `Calling the webhook failed with ${response.status()}: ${await response.text()}`).toBe(true);
      },
      expectUnfinishedRun: async ({ flowId }) => {
        await expect.poll(async () => (await latestRun({ request, session, flowId }))?.status, {
          message: `No queued or running run of flow ${flowId}`,
          timeout: RUN_TIMEOUT_MS,
        }).toMatch(UNFINISHED_STATUS);
      },
      expectRunSucceeded: async ({ flowId }) => {
        await expect.poll(async () => (await latestRun({ request, session, flowId }))?.status, {
          message: `The run of flow ${flowId} did not succeed`,
          timeout: RUN_TIMEOUT_MS,
        }).toBe('SUCCEEDED');
      },
      webhookTriggerRuns: () => readWebhookTriggerRuns({ request, session }),
      expectWebhookTriggerRuns: async ({ moreThan }) => {
        await expect.poll(() => readWebhookTriggerRuns({ request, session }), {
          message: `The trigger run count of ${WEBHOOK_PIECE} did not grow past ${moreThan}`,
          timeout: RUN_TIMEOUT_MS,
        }).toBeGreaterThan(moreThan);
      },
    });
  },
});

export { expect } from '@playwright/test';

async function latestRun({ request, session, flowId }: { request: APIRequestContext; session: E2eSession; flowId: string }) {
  const page = await e2eApi.callApi<{ data: { status: string }[] }>({
    request,
    session,
    method: 'GET',
    path: '/api/v1/flow-runs',
    params: { projectId: session.projectId, flowId, limit: '1' },
  });
  return page.data[0];
}

async function readWebhookTriggerRuns({ request, session }: { request: APIRequestContext; session: E2eSession }): Promise<number> {
  const report = await e2eApi.callApi<TriggerStatusReport>({ request, session, method: 'GET', path: '/api/v1/trigger-runs/status' });
  return report.pieces[WEBHOOK_PIECE]?.totalRuns ?? 0;
}

export const WEBHOOK_PIECE = '@activepieces/piece-webhook';
const UNFINISHED_STATUS = /^(QUEUED|RUNNING)$/;
const RUN_TIMEOUT_MS = 60_000;

type TriggerStatusReport = { pieces: Record<string, { totalRuns: number } | undefined> };

type Operations = {
  callWebhook: (params: { flow: SeededFlow }) => Promise<void>;
  expectUnfinishedRun: (params: { flowId: string }) => Promise<void>;
  expectRunSucceeded: (params: { flowId: string }) => Promise<void>;
  webhookTriggerRuns: () => Promise<number>;
  expectWebhookTriggerRuns: (params: { moreThan: number }) => Promise<void>;
};
