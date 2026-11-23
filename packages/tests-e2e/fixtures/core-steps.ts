import { expect } from '@playwright/test';
import { e2eApi, FlowTemplate } from './api';
import { test as base } from './index';

export const test = base.extend<{ flowRuns: FlowRuns }>({
  flowRuns: async ({ request, session }, use) => {
    const listFinished = async ({ flowId }: { flowId: string }) => {
      const page = await e2eApi.callApi<{ data: RunSummary[] }>({
        request,
        session,
        method: 'GET',
        path: '/api/v1/flow-runs',
        params: { projectId: session.projectId, flowId, limit: '10' },
      });
      return page.data.filter((run) => !UNFINISHED.includes(run.status)).reverse();
    };
    await use({
      succeeded: async ({ flowId, count }) => {
        await expect.poll(async () => (await listFinished({ flowId })).length, { timeout: 90000 }).toBeGreaterThanOrEqual(count);
        const runs = await Promise.all((await listFinished({ flowId })).map((run) =>
          e2eApi.callApi<RunWithSteps>({ request, session, method: 'GET', path: `/api/v1/flow-runs/${run.id}` }),
        ));
        for (const run of runs) {
          expect(run.status, await e2eApi.describeRun({ request, session, runId: run.id })).toBe('SUCCEEDED');
        }
        return runs;
      },
      externalIdOf: async ({ flowId }) => {
        const flow = await e2eApi.callApi<{ externalId: string }>({ request, session, method: 'GET', path: `/api/v1/flows/${flowId}` });
        return flow.externalId;
      },
    });
  },
});

function withSubflow({ template, externalId }: { template: FlowTemplate; externalId: string }): FlowTemplate {
  return JSON.parse(JSON.stringify(template).replaceAll(SUBFLOW_PLACEHOLDER, externalId));
}

export { expect } from '@playwright/test';
export const coreSteps = { withSubflow };

const SUBFLOW_PLACEHOLDER = 'SUBFLOW_EXTERNAL_ID';
const UNFINISHED = ['QUEUED', 'RUNNING', 'PAUSED', 'SCHEDULED'];

type RunSummary = { id: string; status: string };
type RunWithSteps = { id: string; status: string; steps: Record<string, { output?: unknown }> };
type FlowRuns = {
  succeeded: (params: { flowId: string; count: number }) => Promise<RunWithSteps[]>;
  externalIdOf: (params: { flowId: string }) => Promise<string>;
};
