import { afterEach, describe, expect, test, vi } from 'vitest';
import { todoistRestClient } from '../src/lib/common/client/rest-client';

function stubFetch(): Seen[] {
  const seen: Seen[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      const body = typeof init?.body === 'string' ? init.body : null;
      seen.push({ url, body });
      return new Response(JSON.stringify({ id: '6X7rM8997g3RQmvh' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    })
  );
  return seen;
}

function sentBody(seen: Seen[]): Record<string, unknown> {
  expect(seen).toHaveLength(1);
  const raw = seen[0].body;
  if (raw === null) {
    throw new Error('request had no body');
  }
  return JSON.parse(raw);
}

async function createWithDue(dueDate: string) {
  const seen = stubFetch();
  await todoistRestClient.tasks.create({
    token: 'TKN',
    content: 'Buy milk',
    due_date: dueDate,
  });
  return sentBody(seen);
}

async function updateWithDue(dueDate: string) {
  const seen = stubFetch();
  await todoistRestClient.tasks.update({
    token: 'TKN',
    task_id: '6X7rM8997g3RQmvh',
    due_date: dueDate,
  });
  return sentBody(seen);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each([
  ['Create Task', createWithDue],
  ['Update Task', updateWithDue],
])('%s due date', (_name, send) => {
  test('a date-only value is sent as due_date', async () => {
    const body = await send('2026-12-31');
    expect(body['due_date']).toBe('2026-12-31');
    expect(body['due_datetime']).toBeUndefined();
    expect(body['due_string']).toBeUndefined();
  });

  test('a date-time with an offset is sent as due_datetime and keeps the instant', async () => {
    const body = await send('2026-12-31T15:00:00+02:00');
    expect(body['due_datetime']).toBe('2026-12-31T13:00:00.000Z');
    expect(body['due_date']).toBeUndefined();
    expect(body['due_string']).toBeUndefined();
  });

  test('natural-language text is sent as due_string', async () => {
    const body = await send('tomorrow 5pm');
    expect(body['due_string']).toBe('tomorrow 5pm');
    expect(body['due_date']).toBeUndefined();
    expect(body['due_datetime']).toBeUndefined();
  });
});

type Seen = { url: string; body: string | null };
