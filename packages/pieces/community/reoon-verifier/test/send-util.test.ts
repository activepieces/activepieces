import {
  AppConnectionType,
  InputPropertyMap,
} from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockActionContext } from '../../../framework/src/lib/test';
import '../src';
import { bulkEmailVerification } from '../src/lib/actions/bulk-email-verification';
import { createBulkEmailVerification } from '../src/lib/actions/create-bulk-email-verification';
import { verifyEmail } from '../src/lib/actions/verify-email';
import { splitEmails, verifySingleEmail } from '../src/lib/common/send-util';

const API_KEY = 'secret-key';

describe('verifySingleEmail', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('encodes a plus-tagged address so it reaches Reoon intact', async () => {
    const seen = stubFetch({ body: { status: 'safe' } });

    await verifySingleEmail('name+tag@example.com', 'quick', API_KEY);

    const url = new URL(seen[0].url);
    expect(url.searchParams.get('email')).toBe('name+tag@example.com');
    expect(seen[0].url).toContain('name%2Btag%40example.com');
    expect(url.searchParams.get('key')).toBe(API_KEY);
    expect(url.searchParams.get('mode')).toBe('quick');
  });

  it('does not let an address containing & and = inject query parameters', async () => {
    const seen = stubFetch({ body: { status: 'safe' } });

    await verifySingleEmail('a&mode=quick@example.com', 'power', API_KEY);

    const url = new URL(seen[0].url);
    expect(url.searchParams.getAll('mode')).toEqual(['power']);
    expect(url.searchParams.get('email')).toBe('a&mode=quick@example.com');
  });
});

describe('splitEmails', () => {
  it('splits on commas, trims and drops empty entries', () => {
    expect(
      splitEmails([' a@x.com , b@x.com', 'c@x.com,,', '', ' '])
    ).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
  });
});

describe('bulk verification actions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('bulkEmailVerification posts the split emails with the task name and key', async () => {
    const seen = stubFetch({ body: { status: 'success', task_id: 't1' } });
    const propsValue = {
      taskName: 'List',
      emails: [' a@x.com, b@x.com ', 'c@x.com,'],
    };
    const base = createMockActionContext<InputPropertyMap>({ propsValue });

    await bulkEmailVerification.run({
      ...base,
      auth: { type: AppConnectionType.SECRET_TEXT, secret_text: API_KEY },
      propsValue,
    });

    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('POST');
    expect(JSON.parse(seen[0].body ?? '')).toEqual(expectedBulkBody());
  });

  it('createBulkEmailVerification posts the same body as bulkEmailVerification', async () => {
    const seen = stubFetch({ body: { status: 'success', task_id: 't1' } });
    const propsValue = {
      taskName: 'List',
      emails: [' a@x.com, b@x.com ', 'c@x.com,'],
    };
    const base = createMockActionContext<InputPropertyMap>({ propsValue });

    await createBulkEmailVerification.run({
      ...base,
      auth: { type: AppConnectionType.SECRET_TEXT, secret_text: API_KEY },
      propsValue,
    });

    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe('POST');
    expect(JSON.parse(seen[0].body ?? '')).toEqual(expectedBulkBody());
  });
});

describe('verifyEmail', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the fetched JSON body in Quick mode', async () => {
    const responseBody = { email: 'a@x.com', status: 'safe', mode: 'quick' };
    const seen = stubFetch({ body: responseBody });
    const propsValue = { email: 'a@x.com', mode: 'quick' };
    const base = createMockActionContext<InputPropertyMap>({ propsValue });

    const result = await verifyEmail.run({
      ...base,
      auth: { type: AppConnectionType.SECRET_TEXT, secret_text: API_KEY },
      propsValue,
    });

    expect(result).toEqual(responseBody);
    expect(new URL(seen[0].url).searchParams.get('mode')).toBe('quick');
  });
});

function expectedBulkBody() {
  return {
    name: 'List',
    emails: ['a@x.com', 'b@x.com', 'c@x.com'],
    key: API_KEY,
  };
}

function stubFetch({ body }: { body: unknown }): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      const method = (
        init?.method ?? (input instanceof Request ? input.method : 'GET')
      ).toUpperCase();
      seen.push({
        url,
        method,
        body: typeof init?.body === 'string' ? init.body : null,
      });
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    })
  );
  return seen;
}

type SeenRequest = {
  url: string;
  method: string;
  body: string | null;
};
