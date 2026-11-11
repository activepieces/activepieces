import { test as base } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eResource, E2eSession } from './api';
import { e2eMail, Mailbox } from './mail';

export const test = base.extend<CustomFixtures>({
  session: async ({}, use) => {
    await use(e2eApi.readSession());
  },

  cleanup: async ({ request, session }, use) => {
    const tracked: TrackedRecord[] = [];
    await use({ track: (record) => tracked.push(record) });
    const failures = await deleteTracked({ request, session, records: [...tracked].reverse() });
    if (failures.length > 0) {
      throw new Error(`Cleanup could not delete ${failures.length} tracked record(s):\n${failures.join('\n')}`);
    }
  },

  mailbox: async ({ request }, use) => {
    await use(e2eMail.connect({ request }));
  },
});

export { expect } from '@playwright/test';

async function deleteTracked({ request, session, records }: { request: APIRequestContext; session: E2eSession; records: TrackedRecord[] }): Promise<string[]> {
  const failures: string[] = [];
  for (const { resource, id } of records) {
    const failure = await e2eApi.deleteById({ request, session, resource, id }).then(
      () => null,
      (error: unknown) => (error instanceof Error ? error.message : String(error)),
    );
    if (failure !== null) {
      failures.push(failure);
    }
  }
  return failures;
}

export type Cleanup = { track: (record: TrackedRecord) => void };

type TrackedRecord = { resource: E2eResource; id: string };

type CustomFixtures = {
  session: E2eSession;
  cleanup: Cleanup;
  mailbox: Mailbox;
};
