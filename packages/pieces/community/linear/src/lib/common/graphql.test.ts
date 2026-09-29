/// <reference types="vitest/globals" />

import { vi } from 'vitest';

const rawRequest = vi.fn();

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    client = { rawRequest };
  },
  LinearDocument: {},
}));

import '../../index';
import { linearGraphql } from './graphql';

const auth = { type: 'SECRET_TEXT', secret_text: 'lin_api_test' };

describe('linearGraphql helpers', () => {
  beforeEach(() => rawRequest.mockReset());

  test('definedOnly drops undefined, null and blank strings but keeps false, 0 and arrays', () => {
    expect(
      linearGraphql.definedOnly({ a: undefined, b: null, c: '', d: '  ', e: false, f: 0, g: [], h: 'x' }),
    ).toEqual({ e: false, f: 0, g: [], h: 'x' });
  });

  test('toTimelessDate keeps the date part and rejects anything else', () => {
    expect(linearGraphql.toTimelessDate({ value: '2026-10-15', fieldName: 'Due' })).toBe('2026-10-15');
    expect(linearGraphql.toTimelessDate({ value: '2026-10-15T00:00:00.000Z', fieldName: 'Due' })).toBe('2026-10-15');
    expect(linearGraphql.toTimelessDate({ value: undefined, fieldName: 'Due' })).toBeUndefined();
    expect(() => linearGraphql.toTimelessDate({ value: '15/10/2026', fieldName: 'Due' })).toThrow('YYYY-MM-DD');
  });

  test('toStringArray trims, drops blanks and returns undefined for an empty list', () => {
    expect(linearGraphql.toStringArray([' a ', '', 3])).toEqual(['a', '3']);
    expect(linearGraphql.toStringArray([])).toBeUndefined();
    expect(linearGraphql.toStringArray(undefined)).toBeUndefined();
  });

  test('clampLimit bounds the page size', () => {
    expect(linearGraphql.clampLimit({ value: undefined, fallback: 50, max: 250 })).toBe(50);
    expect(linearGraphql.clampLimit({ value: 1000, fallback: 50, max: 250 })).toBe(250);
    expect(linearGraphql.clampLimit({ value: '0', fallback: 50, max: 250 })).toBe(1);
  });

  test('resolveIssueId passes a UUID through without a request', async () => {
    const id = '0b6d0a4c-2f0e-4a51-9d8e-4a2b1d1c9f00';
    expect(await linearGraphql.resolveIssueId({ auth, value: id })).toBe(id);
    expect(rawRequest).not.toHaveBeenCalled();
  });

  test('resolveIssueId looks up an identifier once and returns the UUID', async () => {
    rawRequest.mockResolvedValue({ data: { issue: { id: 'uuid-1' } } });
    expect(await linearGraphql.resolveIssueId({ auth, value: 'eng-12' })).toBe('uuid-1');
    expect(rawRequest).toHaveBeenCalledTimes(1);
    expect(rawRequest.mock.calls[0][1]).toEqual({ id: 'ENG-12' });
  });

  test('resolveIssueId rejects values that are neither', async () => {
    await expect(linearGraphql.resolveIssueId({ auth, value: 'not an id' })).rejects.toThrow('not an issue UUID');
    await expect(linearGraphql.resolveIssueId({ auth, value: '' })).rejects.toThrow('required');
  });

  test('request maps Linear error types to actionable messages', async () => {
    rawRequest.mockRejectedValueOnce(Object.assign(new Error('x'), { type: 'Forbidden', errors: [{ message: 'no access' }] }));
    await expect(linearGraphql.request({ auth, query: 'query { viewer { id } }' })).rejects.toThrow('Write or Admin permission');
    rawRequest.mockRejectedValueOnce(Object.assign(new Error('x'), { type: 'Ratelimited' }));
    await expect(linearGraphql.request({ auth, query: 'query { viewer { id } }' })).rejects.toThrow('rate limit');
    rawRequest.mockRejectedValueOnce(Object.assign(new Error('x'), { type: 'InvalidInput', errors: [{ message: 'bad teamId' }] }));
    await expect(linearGraphql.request({ auth, query: 'query { viewer { id } }' })).rejects.toThrow('bad teamId');
  });

  test('not-found and plan-limit errors read cleanly', async () => {
    rawRequest.mockRejectedValueOnce(Object.assign(new Error('x'), { type: 'InvalidInput', errors: [{ message: 'Could not find referenced Issue.' }] }));
    await expect(linearGraphql.resolveIssueId({ auth, value: 'ENG-99999' })).rejects.toThrow('No Linear issue found for ENG-99999.');
    rawRequest.mockRejectedValueOnce(Object.assign(new Error('x'), { type: 'InvalidInput', errors: [{ message: 'Could not find referenced ProjectUpdate.' }] }));
    await expect(linearGraphql.request({ auth, query: 'query { viewer { id } }' })).rejects.toThrow('No Linear project status update found');
    rawRequest.mockRejectedValueOnce(
      Object.assign(new Error('x'), { type: 'Forbidden', errors: [{ message: 'You have reached the limit of teams allowed in your current plan. Please upgrade to create more teams.' }] }),
    );
    await expect(linearGraphql.request({ auth, query: 'query { viewer { id } }' })).rejects.toMatchObject({
      message:
        'Linear refused this request: You have reached the limit of teams allowed in your current plan. Please upgrade to create more teams.',
    });
  });

  test('requireSuccess refuses a payload without success', () => {
    expect(() => linearGraphql.requireSuccess({ payload: { success: false }, what: 'thing' })).toThrow('did not confirm the thing');
  });
});
