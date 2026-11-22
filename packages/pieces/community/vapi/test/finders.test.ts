import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findAssistant } from '../src/lib/actions/find-assistant';
import { findCalls } from '../src/lib/actions/find-calls';
import { findPhoneNumber } from '../src/lib/actions/find-phone-number';
import { findTool } from '../src/lib/actions/find-tool';

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: { secret_text: 'k' } }]));
}

function mockOk({ body }: { body: unknown }) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('finders', () => {
  it('find_assistant scans 1000, matches case-insensitively and caps at limit', async () => {
    const spy = mockOk({
      body: [
        { id: 'a1', name: 'Sales Bot', createdAt: 't1', model: { provider: 'openai' } },
        { id: 'a2', name: 'support', createdAt: 't2' },
        { id: 'a3', name: 'SALES east', createdAt: 't3' },
      ],
    });
    const result = await run({ action: findAssistant, propsValue: { nameContains: 'sales', limit: 1 } });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ limit: '1000' });
    expect(result).toEqual({ assistants: [{ id: 'a1', name: 'Sales Bot', createdAt: 't1' }], truncated: false });
  });

  it('find_phone_number matches on digits of the number', async () => {
    mockOk({ body: [{ id: 'p1', number: '+14155551234', name: 'Main' }, { id: 'p2', number: '+12125550000', name: 'NY' }] });
    const result = await run({ action: findPhoneNumber, propsValue: { numberOrNameContains: '(415) 555' } });
    expect(result).toEqual({
      phoneNumbers: [{ id: 'p1', number: '+14155551234', name: 'Main', provider: null, assistantId: null, squadId: null }],
      truncated: false,
    });
  });

  it('find_tool filters by type and function name', async () => {
    mockOk({
      body: [
        { id: 't1', type: 'function', function: { name: 'get_order', description: 'd' } },
        { id: 't2', type: 'endCall' },
        { id: 't3', type: 'function', function: { name: 'cancel_order' } },
      ],
    });
    const result = await run({ action: findTool, propsValue: { type: 'function', nameContains: 'GET' } });
    expect(result).toEqual({ tools: [{ id: 't1', type: 'function', name: 'get_order', description: 'd' }], truncated: false });
  });

  it('find_calls filters customer number client-side over 1000 calls', async () => {
    const spy = mockOk({
      body: [
        { id: 'c1', status: 'ended', customer: { number: '+14155551234' }, createdAt: 't', cost: 1 },
        { id: 'c2', status: 'ended', customer: { number: '+12125550000' }, createdAt: 't', cost: 2 },
      ],
    });
    const result = await run({ action: findCalls, propsValue: { customerNumber: '+1 415 555 1234' } });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ limit: '1000' });
    expect(result).toEqual({
      calls: [{ id: 'c1', status: 'ended', endedReason: null, customerNumber: '+14155551234', createdAt: 't', cost: 1 }],
      truncated: false,
    });
  });

  it('flags truncated when 1000 records were scanned without enough matches', async () => {
    mockOk({ body: Array.from({ length: 1000 }, (_, i) => ({ id: `a${i}`, name: `bot ${i}` })) });
    const result = await run({ action: findAssistant, propsValue: { nameContains: 'missing' } });
    expect(result).toEqual({ assistants: [], truncated: true });
  });

  it('does not flag truncated when the limit was filled', async () => {
    mockOk({ body: Array.from({ length: 1000 }, (_, i) => ({ id: `a${i}`, name: `bot ${i}` })) });
    const result = await run({ action: findAssistant, propsValue: { nameContains: 'bot', limit: 2 } });
    expect(result).toMatchObject({ truncated: false });
  });

  it('find_calls flags truncated when the customer-number scan hit 1000', async () => {
    mockOk({ body: Array.from({ length: 1000 }, (_, i) => ({ id: `c${i}`, customer: { number: '+12125550000' } })) });
    const result = await run({ action: findCalls, propsValue: { customerNumber: '+14155551234' } });
    expect(result).toEqual({ calls: [], truncated: true });
  });

  it('find_calls without a customer number asks Vapi for the limit only', async () => {
    const spy = mockOk({ body: [] });
    await run({ action: findCalls, propsValue: { assistantId: 'a1' } });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ assistantId: 'a1', limit: '20' });
  });
});
