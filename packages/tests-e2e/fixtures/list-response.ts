import type { Page, Route } from '@playwright/test';
import { test as base } from './index';

export const test = base.extend<{ listResponse: ListResponse }>({
  listResponse: async ({ page }, use) => {
    const fakes: ListFake[] = [];
    const answer = async ({ resource, status, json }: FakeAnswer): Promise<() => Promise<void>> => {
      const fake = await fakeListRequest({ page, resource, status, json });
      fakes.push(fake);
      return fake.restore;
    };
    await use({
      empty: ({ resource }) => answer({ resource, status: 200, json: { data: [], next: null, previous: null } }),
      fail: ({ resource }) => answer({ resource, status: 500, json: { message: 'E2E list failure' } }),
      ERROR_STATE_TIMEOUT_MS: 15_000,
    });
    const unused = fakes.filter((fake) => fake.hits() === 0).map((fake) => fake.resource);
    if (unused.length > 0) {
      throw new Error(noRequestMessage(unused));
    }
  },
});

async function fakeListRequest({ page, resource, status, json }: FakeAnswer & { page: Page }): Promise<ListFake> {
  let hits = 0;
  const isListRequest = (url: URL) => url.pathname.endsWith(`/v1/${resource}`);
  const handler = async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    hits += 1;
    await route.fulfill({ status, json });
  };
  await page.route(isListRequest, handler);
  return {
    resource,
    hits: () => hits,
    restore: async () => {
      await page.unroute(isListRequest, handler);
      if (hits === 0) {
        throw new Error(noRequestMessage([resource]));
      }
    },
  };
}

function noRequestMessage(resources: string[]): string {
  return `No GET request reached the fake answer for ${resources.join(', ')}. Check the resource name against the API path, and set the fake before the page opens.`;
}

export { expect } from '@playwright/test';

type FakeAnswer = { resource: string; status: number; json: unknown };

type ListFake = { resource: string; hits: () => number; restore: () => Promise<void> };

export type ListResponse = {
  empty: (params: { resource: string }) => Promise<() => Promise<void>>;
  fail: (params: { resource: string }) => Promise<() => Promise<void>>;
  ERROR_STATE_TIMEOUT_MS: number;
};
