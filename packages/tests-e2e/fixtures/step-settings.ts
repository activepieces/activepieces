import { e2eApi } from './api';
import { test as base } from './index';

export const test = base.extend<{ savedStepInput: SavedStepInput }>({
  savedStepInput: async ({ request, session }, use) => {
    await use(async ({ flowId, stepName }) => {
      const flow = await e2eApi.callApi<SavedFlow>({ request, session, method: 'GET', path: `/api/v1/flows/${flowId}` });
      return findStep({ step: flow.version.trigger, stepName })?.settings.input;
    });
  },
});

export { expect } from '@playwright/test';

function findStep({ step, stepName }: { step: SavedStep | undefined; stepName: string }): SavedStep | undefined {
  if (step === undefined || step.name === stepName) {
    return step;
  }
  return findStep({ step: step.nextAction, stepName });
}

type SavedStep = { name: string; settings: { input: Record<string, unknown> }; nextAction?: SavedStep };
type SavedFlow = { version: { trigger: SavedStep } };
type SavedStepInput = (params: { flowId: string; stepName: string }) => Promise<Record<string, unknown> | undefined>;
