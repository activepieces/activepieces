import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runAgent } from './run-agent';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    httpClient: { sendRequest: vi.fn(async () => ({ body: {} })) },
  };
});

const sendRequest = vi.mocked(httpClient.sendRequest);

async function bodyFor(propsValue: Record<string, unknown>): Promise<Record<string, unknown>> {
  await runAgent.run(createMockActionContext({ propsValue: { prompt: 'do it', ...propsValue } }));
  return sendRequest.mock.calls[0][0].body as Record<string, unknown>;
}

beforeEach(() => {
  sendRequest.mockClear();
});

describe('the model a Run Agent step sends', () => {
  it('sends only the tier id for a tier pick', async () => {
    const body = await bodyFor({ aiProviderModel: { modelTierId: 'tier-1' } });
    expect(body.modelTierId).toBe('tier-1');
    expect(body).not.toHaveProperty('provider');
    expect(body).not.toHaveProperty('modelName');
    expect(body).not.toHaveProperty('providerConfigId');
  });

  it('sends the provider, model and key for a model pick', async () => {
    const body = await bodyFor({ aiProviderModel: { provider: 'openai', model: 'gpt-test', configId: 'config-1' } });
    expect(body).toMatchObject({ provider: 'openai', modelName: 'gpt-test', providerConfigId: 'config-1' });
    expect(body).not.toHaveProperty('modelTierId');
  });

  it('sends no model when the step runs a saved agent', async () => {
    const body = await bodyFor({ agentId: 'agent-1', aiProviderModel: { modelTierId: 'tier-1' } });
    expect(body.agentId).toBe('agent-1');
    expect(body).not.toHaveProperty('modelTierId');
    expect(body).not.toHaveProperty('provider');
  });

  it('sends no model fields when nothing is picked', async () => {
    const body = await bodyFor({ aiProviderModel: {} });
    expect(body).not.toHaveProperty('modelTierId');
    expect(body).not.toHaveProperty('provider');
    expect(body).not.toHaveProperty('modelName');
  });
});
