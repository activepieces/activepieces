import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';
import '../src';
import { parseTriState } from '../src/lib/common/tri-state';
import { todoistUpdateLabelAction } from '../src/lib/actions/update-label.action';
import { todoistUpdateProjectAction } from '../src/lib/actions/update-project.action';

function stubFetch(): Array<Record<string, unknown> | null> {
  const bodies: Array<Record<string, unknown> | null> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      bodies.push(typeof init?.body === 'string' ? JSON.parse(init.body) : null);
      return new Response(JSON.stringify({ id: 'x1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }),
  );
  return bodies;
}

function ctx(propsValue: Record<string, unknown>) {
  return { ...createMockActionContext({ propsValue }), auth: { access_token: 'tok' } };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseTriState', () => {
  test.each([
    ['yes', true],
    ['no', false],
    ['true', true],
    [' FALSE ', false],
    [true, true],
    [false, false],
    ['', undefined],
    [undefined, undefined],
    [null, undefined],
  ])('%j -> %j', (input, expected) => {
    expect(parseTriState(input)).toBe(expected);
  });
});

describe.each([
  ['update label', todoistUpdateLabelAction, { label_id: 'l1' }],
  ['update project', todoistUpdateProjectAction, { project_id: 'p1' }],
])('%s is_favorite', (_name, action, ids) => {
  test('rename only leaves is_favorite out of the request', async () => {
    const bodies = stubFetch();
    await action.run(ctx({ ...ids, name: 'Renamed', is_favorite: '' }));
    expect(bodies[0]).toEqual({ name: 'Renamed' });
  });

  test('omitted entirely leaves is_favorite out', async () => {
    const bodies = stubFetch();
    await action.run(ctx({ ...ids, name: 'Renamed' }));
    expect(bodies[0]).not.toHaveProperty('is_favorite');
  });

  test.each([
    ['yes', true],
    ['no', false],
  ])('%s sends is_favorite=%s', async (value, expected) => {
    const bodies = stubFetch();
    await action.run(ctx({ ...ids, is_favorite: value }));
    expect(bodies[0]).toEqual({ is_favorite: expected });
  });
});
