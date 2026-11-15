import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { E2eSession } from '../../../fixtures/api';
import { e2eFlows } from '../../../fixtures/flows';

test.describe('Replace connection at scale', () => {
  test.skip(!process.env.E2E_REPLACE_CONNECTION_LOAD, 'Set E2E_REPLACE_CONNECTION_LOAD=true to run this load test');

  test('replaces one Hugging Face connection in 200 published flows from the Connections page', async ({ page, request, session, flowCleanup, connectionCleanup }) => {
    test.setTimeout(LOAD_TEST_TIMEOUT_MS);
    const api = createApiClient({ request, session });

    const [webhookVersion, huggingFaceVersion] = await Promise.all([
      api.getPieceVersion(WEBHOOK_PIECE),
      api.getPieceVersion(HUGGING_FACE_PIECE),
    ]);
    const sourceConnection = await api.createHuggingFaceConnection(e2eFlows.uniqueName('HF source'));
    connectionCleanup.track(sourceConnection.id);
    const targetConnection = await api.createHuggingFaceConnection(e2eFlows.uniqueName('HF target'));
    connectionCleanup.track(targetConnection.id);

    const seedStartedAt = Date.now();
    await runWithConcurrency({
      count: FLOW_COUNT,
      concurrency: SEED_CONCURRENCY,
      task: (index) => api.createPublishedFlow({
        displayName: e2eFlows.uniqueName(`replace load #${index + 1}`),
        trigger: buildWebhookTrigger({
          webhookVersion,
          huggingFaceVersion,
          connectionExternalId: sourceConnection.externalId,
        }),
        onCreated: (flowId) => flowCleanup.track(flowId),
      }),
    });
    logTiming(`Created and published ${FLOW_COUNT} flows`, seedStartedAt);

    expect(await api.countFlowsUsingConnection({ externalId: sourceConnection.externalId, published: false })).toBe(FLOW_COUNT);
    expect(await api.countFlowsUsingConnection({ externalId: sourceConnection.externalId, published: true })).toBe(FLOW_COUNT);

    page.setDefaultTimeout(ACTION_TIMEOUT_MS);
    await page.goto(`/projects/${session.projectId}/connections`);
    await page.getByRole('button', { name: 'Replace', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await pickOption({ page, trigger: dialog.getByRole('combobox').filter({ hasText: 'Select a piece' }), search: 'Hugging Face' });
    await pickOption({ page, trigger: dialog.getByRole('combobox').filter({ hasText: 'Choose connection to replace' }).first(), search: sourceConnection.displayName });
    await pickOption({ page, trigger: dialog.getByRole('combobox').filter({ hasText: 'Choose connection to replace with' }), search: targetConnection.displayName });
    const reviewStartedAt = Date.now();
    await dialog.getByRole('button', { name: 'Next' }).click();
    await expect(dialog.getByText(/A replace changes up to 200 flows\./)).toBeVisible({ timeout: REVIEW_STEP_TIMEOUT_MS });
    logTiming('Loaded the review step', reviewStartedAt);

    await dialog.getByRole('combobox').filter({ hasText: 'Draft only' }).click();
    await page.getByRole('option', { name: 'Draft and published' }).click();

    const replaceStartedAt = Date.now();
    const replaceResponse = page.waitForResponse(
      (response) => response.url().includes('/v1/app-connections/replace'),
      { timeout: REPLACE_TIMEOUT_MS },
    );
    await dialog.getByRole('button', { name: 'Replace', exact: true }).click();
    const response = await replaceResponse;
    logTiming(`Replace request finished with HTTP ${response.status()}`, replaceStartedAt);
    expect(response.status(), await response.text()).toBe(204);

    expect(await api.countFlowsUsingConnection({ externalId: sourceConnection.externalId, published: false })).toBe(0);
    expect(await api.countFlowsUsingConnection({ externalId: sourceConnection.externalId, published: true })).toBe(0);
    expect(await api.countFlowsUsingConnection({ externalId: targetConnection.externalId, published: false })).toBe(FLOW_COUNT);
    expect(await api.countFlowsUsingConnection({ externalId: targetConnection.externalId, published: true })).toBe(FLOW_COUNT);
  });
});

function createApiClient({ request, session }: { request: APIRequestContext; session: E2eSession }) {
  const { projectId } = session;
  const headers = { Authorization: `Bearer ${session.token}` };

  async function call<T>({ method, path, data, params }: CallParams): Promise<T> {
    const response = await request.fetch(`/api${path}`, { method, headers, data, params, timeout: REPLACE_TIMEOUT_MS });
    if (!response.ok()) {
      throw new Error(`${method} ${path} failed with ${response.status()}: ${await response.text()}`);
    }
    const body = await response.text();
    return (body ? JSON.parse(body) : undefined) as T;
  }

  return {
    async getPieceVersion(pieceName: string): Promise<string> {
      const piece = await call<{ version: string }>({ method: 'GET', path: `/v1/pieces/${encodeURIComponent(pieceName)}`, params: { projectId } });
      return piece.version;
    },
    async createHuggingFaceConnection(displayName: string): Promise<Connection> {
      return call<Connection>({
        method: 'POST',
        path: '/v1/app-connections',
        data: {
          externalId: `hf_${Math.random().toString(36).slice(2)}`,
          displayName,
          pieceName: HUGGING_FACE_PIECE,
          projectId,
          type: 'SECRET_TEXT',
          value: { type: 'SECRET_TEXT', secret_text: 'e2e-not-a-real-token' },
        },
      });
    },
    async createPublishedFlow({ displayName, trigger, onCreated }: CreatePublishedFlowParams): Promise<string> {
      const flow = await call<{ id: string; version: { schemaVersion: string | null } }>({
        method: 'POST',
        path: '/v1/flows',
        data: { displayName, projectId },
      });
      onCreated(flow.id);
      await call({
        method: 'POST',
        path: `/v1/flows/${flow.id}`,
        data: {
          type: 'IMPORT_FLOW',
          request: { displayName, trigger, schemaVersion: flow.version.schemaVersion, notes: null },
        },
      });
      await call({
        method: 'POST',
        path: `/v1/flows/${flow.id}`,
        data: { type: 'LOCK_AND_PUBLISH', request: {} },
      });
      return flow.id;
    },
    async countFlowsUsingConnection({ externalId, published }: { externalId: string; published: boolean }): Promise<number> {
      let count = 0;
      let cursor: string | undefined = undefined;
      do {
        const page: { data: unknown[]; next: string | null } = await call({
          method: 'GET',
          path: '/v1/flows',
          params: {
            projectId,
            connectionExternalIds: externalId,
            limit: 1000,
            ...(published ? { versionState: 'LOCKED' } : {}),
            ...(cursor ? { cursor } : {}),
          },
        });
        count += page.data.length;
        cursor = page.next ?? undefined;
      } while (cursor);
      return count;
    },
  };
}

function buildWebhookTrigger({ webhookVersion, huggingFaceVersion, connectionExternalId }: BuildWebhookTriggerParams) {
  const actions = Array.from({ length: STEPS_PER_FLOW }, (_, index) => ({
    name: `step_${index + 1}`,
    type: 'PIECE',
    valid: true,
    displayName: `Text Classification ${index + 1}`,
    lastUpdatedDate: new Date().toISOString(),
    settings: {
      pieceName: HUGGING_FACE_PIECE,
      pieceVersion: huggingFaceVersion,
      actionName: 'text_classification',
      input: {
        auth: `{{connections['${connectionExternalId}']}}`,
        classificationMode: 'zero-shot',
        text: 'The replace connection load test sends this text.',
      },
      propertySettings: {},
      errorHandlingOptions: {
        continueOnFailure: { value: false },
        retryOnFailure: { value: false },
      },
    },
  }));
  const firstAction = actions.reduceRight<Record<string, unknown> | undefined>(
    (nextAction, action) => ({ ...action, ...(nextAction ? { nextAction } : {}) }),
    undefined,
  );
  return {
    name: 'trigger',
    type: 'PIECE_TRIGGER',
    valid: true,
    displayName: 'Catch Webhook',
    lastUpdatedDate: new Date().toISOString(),
    settings: {
      pieceName: WEBHOOK_PIECE,
      pieceVersion: webhookVersion,
      triggerName: 'catch_webhook',
      input: { authType: 'none' },
      propertySettings: {},
    },
    nextAction: firstAction,
  };
}

async function pickOption({ page, trigger, search }: PickOptionParams): Promise<void> {
  await trigger.click();
  await page.keyboard.type(search);
  await page.getByRole('option', { name: search }).first().click();
}

async function runWithConcurrency<T>({ count, concurrency, task }: RunWithConcurrencyParams<T>): Promise<T[]> {
  const results: T[] = new Array(count);
  const failures: unknown[] = [];
  let nextIndex = 0;
  async function worker(): Promise<void> {
    while (nextIndex < count && failures.length === 0) {
      const index = nextIndex++;
      try {
        results[index] = await task(index);
      } catch (error) {
        failures.push(error);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, count) }, () => worker()));
  if (failures.length > 0) {
    throw failures[0];
  }
  return results;
}

function logTiming(label: string, startedAt: number): void {
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`⏱ ${label} in ${seconds}s`);
  test.info().annotations.push({ type: 'timing', description: `${label}: ${seconds}s` });
}

const FLOW_COUNT = 200;
const STEPS_PER_FLOW = 10;
const SEED_CONCURRENCY = 10;
const WEBHOOK_PIECE = '@activepieces/piece-webhook';
const HUGGING_FACE_PIECE = '@activepieces/piece-hugging-face';
const LOAD_TEST_TIMEOUT_MS = 60 * 60 * 1000;
const ACTION_TIMEOUT_MS = 30 * 1000;
const REVIEW_STEP_TIMEOUT_MS = 5 * 60 * 1000;
const REPLACE_TIMEOUT_MS = 30 * 60 * 1000;

type Connection = {
  id: string;
  externalId: string;
  displayName: string;
};

type CreatePublishedFlowParams = {
  displayName: string;
  trigger: unknown;
  onCreated: (flowId: string) => void;
};

type CallParams = {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  data?: unknown;
  params?: Record<string, string | number>;
};

type BuildWebhookTriggerParams = {
  webhookVersion: string;
  huggingFaceVersion: string;
  connectionExternalId: string;
};

type PickOptionParams = {
  page: Page;
  trigger: ReturnType<Page['getByRole']>;
  search: string;
};

type RunWithConcurrencyParams<T> = {
  count: number;
  concurrency: number;
  task: (index: number) => Promise<T>;
};
