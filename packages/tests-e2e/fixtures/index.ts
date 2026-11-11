import { test as base } from '@playwright/test';
import { e2eApi, E2eResource, E2eSession } from './api';
import { e2eMail, Mailbox } from './mail';

export const test = base.extend<CustomFixtures>({
  session: async ({}, use) => {
    await use(e2eApi.readSession());
  },

  cleanup: async ({ request, session }, use) => {
    const tracked: TrackedRecord[] = [];
    await use({ track: (record) => tracked.push(record) });
    for (const { resource, id } of [...tracked].reverse()) {
      await e2eApi.deleteById({ request, session, resource, id });
    }
  },

  mailbox: async ({ request }, use) => {
    await use(e2eMail.connect({ request }));
  },
});

export { expect } from '@playwright/test';

export type Cleanup = { track: (record: TrackedRecord) => void };

type TrackedRecord = { resource: E2eResource; id: string };

type CustomFixtures = {
  session: E2eSession;
  cleanup: Cleanup;
  mailbox: Mailbox;
};
