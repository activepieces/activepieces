import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, httpClient } from '@activepieces/pieces-common';
import { listAgentExecutions } from '../src/lib/actions/list-agent-executions';
import { listAgents } from '../src/lib/actions/list-agents';
import { getAccountInfo } from '../src/lib/actions/get-account-info';
import { callCompletionReport } from '../src/lib/triggers/call-completion-report';
import { BASE_URL, BolnaApiError } from '../src/lib/common/client';

function mockResponse(body: unknown) {
  return vi
    .spyOn(httpClient, 'sendRequest')
    .mockResolvedValue({ status: 200, headers: {}, body });
}

function runAction<T extends { run: (ctx: never) => unknown }>({
  action,
  propsValue,
}: {
  action: T;
  propsValue: Record<string, unknown>;
}) {
  const ctx = { auth: { secret_text: 'bn-test' }, propsValue };
  return Reflect.apply(action.run, action, [ctx]);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('client', () => {
  it('has no leading whitespace in the base url', () => {
    expect(BASE_URL).toBe('https://api.bolna.ai');
  });

  it('surfaces status and vendor message without a body field', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 404, responseBody: { message: 'Agent not found' } })
    );
    const error: unknown = await runAction({ action: listAgents, propsValue: {} }).catch(
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(BolnaApiError);
    expect(error).toMatchObject({
      status: 404,
      message: 'Bolna API request failed (404): Agent not found',
      responseBody: { message: 'Agent not found' },
    });
    expect(Reflect.has(Object(error), 'body')).toBe(false);
  });
});

describe('list_agent_executions', () => {
  it('rejects ranges over 7 days without calling the API', async () => {
    const spy = mockResponse({});
    await expect(
      runAction({
        action: listAgentExecutions,
        propsValue: {
          agentId: 'a1',
          from: '2026-10-01T00:00:00Z',
          to: '2026-10-09T00:00:00Z',
        },
      })
    ).rejects.toThrow('cannot exceed 7 days');
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects page size above 50', async () => {
    const spy = mockResponse({});
    await expect(
      runAction({ action: listAgentExecutions, propsValue: { agentId: 'a1', pageSize: 51 } })
    ).rejects.toThrow('Page Size');
    expect(spy).not.toHaveBeenCalled();
  });

  it('caps "to" at 7 days after "from" and sends the query', async () => {
    const spy = mockResponse({
      page_number: 1,
      page_size: 20,
      total: 0,
      has_more: false,
      data: [],
      filters: [],
    });
    const result = await runAction({
      action: listAgentExecutions,
      propsValue: { agentId: 'a1', from: '2026-01-01T00:00:00.000Z', status: 'completed' },
    });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://api.bolna.ai/v2/agent/a1/executions');
    expect(request.queryParams).toEqual({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-08T00:00:00.000Z',
      page_number: '1',
      page_size: '20',
      status: 'completed',
    });
    expect(result).toEqual({ page_number: 1, page_size: 20, total: 0, has_more: false, data: [] });
  });
});

describe('projections', () => {
  it('list_agents drops prompts and tasks', async () => {
    mockResponse([
      { id: 'a1', agent_name: 'odai', agent_type: 'simple_llm_agent', agent_status: 'seeding', tasks: [1], agent_prompts: { task_1: { system_prompt: 'x' } } },
    ]);
    const result = await runAction({ action: listAgents, propsValue: {} });
    expect(result).toEqual({
      agents: [{ id: 'a1', agent_name: 'odai', agent_type: 'simple_llm_agent', agent_status: 'seeding', created_at: null, updated_at: null }],
      count: 1,
    });
  });

  it('get_account_info keeps only known fields', async () => {
    mockResponse({ id: 'u1', name: 'n', email: 'e@x.com', wallet: 500, concurrency: { max: 2, current: 0 }, credit_limit: null, extra: 'secret' });
    const result = await runAction({ action: getAccountInfo, propsValue: {} });
    expect(result).toEqual({ id: 'u1', name: 'n', email: 'e@x.com', wallet: 500, credit_limit: null, concurrency: { max: 2, current: 0 } });
  });
});

describe('call completion trigger', () => {
  function runTrigger(body: unknown) {
    return Reflect.apply(callCompletionReport.run, callCompletionReport, [{ payload: { body } }]);
  }
  it('emits completed executions only', async () => {
    expect(await runTrigger({ id: 'e1', status: 'completed' })).toEqual([{ id: 'e1', status: 'completed' }]);
    expect(await runTrigger({ id: 'e1', status: 'in-progress' })).toEqual([]);
  });
  it('ignores an empty body', async () => {
    expect(await runTrigger(undefined)).toEqual([]);
  });
});
