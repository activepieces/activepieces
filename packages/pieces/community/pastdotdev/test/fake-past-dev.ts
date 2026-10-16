import { AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { vi } from 'vitest';

export function installFakePastDev({ responses }: { responses: FakeResponse[] }) {
  const calls: RecordedCall[] = [];
  const queue = [...responses];
  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      authorization: headers.get('authorization'),
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    });
    const next = queue.shift();
    if (!next) {
      throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${String(input)}`);
    }
    return new Response(next.body === undefined ? '' : JSON.stringify(next.body), {
      status: next.status,
      headers: {
        'content-type': 'application/json',
        'x-request-id': next.requestId ?? 'req_test',
      },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls };
}

export function actionContext<P>({
  propsValue,
  apiHost,
}: {
  propsValue: P;
  apiHost?: string;
}) {
  return {
    ...createMockActionContext({ propsValue: {} }),
    propsValue,
    auth: {
      type: AppConnectionType.CUSTOM_AUTH,
      props: { apiKey: FAKE_KEY, apiHost },
    },
  };
}

export const FAKE_KEY = 'past_sk_fake_for_tests';
export const FAKE_HOST = 'https://past.example.test';

export type FakeResponse = {
  status: number;
  body?: unknown;
  requestId?: string;
};

export type RecordedCall = {
  url: string;
  method: string;
  authorization: string | null;
  body: unknown;
};
