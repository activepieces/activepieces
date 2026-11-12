import type { Page, Route } from '@playwright/test';

async function empty({ page, resource }: { page: Page; resource: string }): Promise<() => Promise<void>> {
  return answerListRequest({
    page,
    resource,
    answer: (route) => route.fulfill({ status: 200, json: { data: [], next: null, previous: null } }),
  });
}

async function fail({ page, resource }: { page: Page; resource: string }): Promise<() => Promise<void>> {
  return answerListRequest({
    page,
    resource,
    answer: (route) => route.fulfill({ status: 500, json: { message: 'E2E list failure' } }),
  });
}

async function answerListRequest({ page, resource, answer }: { page: Page; resource: string; answer: (route: Route) => Promise<void> }): Promise<() => Promise<void>> {
  const isListRequest = (url: URL) => url.pathname.endsWith(`/v1/${resource}`);
  const handler = async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    await answer(route);
  };
  await page.route(isListRequest, handler);
  return () => page.unroute(isListRequest, handler);
}

export const listResponse = { empty, fail, ERROR_STATE_TIMEOUT_MS: 15_000 };
