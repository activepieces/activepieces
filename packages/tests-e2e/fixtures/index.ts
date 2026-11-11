import { test as base } from '@playwright/test';
import { e2eApi, E2eResource, E2eSession, FlowTemplate, SeededConnection, SeededFlow } from './api';
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

  seed: async ({ request, session, cleanup }, use) => {
    await use({
      flow: ({ template, publish }) => e2eApi.seedFlow({
        request,
        session,
        template,
        publish,
        onCreated: (flowId) => cleanup.track({ resource: 'flows', id: flowId }),
      }),
      secretTextConnection: ({ pieceName, secret }) => e2eApi.seedSecretTextConnection({
        request,
        session,
        pieceName,
        secret,
        onCreated: (connectionId) => cleanup.track({ resource: 'app-connections', id: connectionId }),
      }),
    });
  },

  mailbox: async ({ request }, use) => {
    await use(e2eMail.connect({ request }));
  },
});

export { expect } from '@playwright/test';

export type Cleanup = { track: (record: TrackedRecord) => void };
export type Seed = {
  flow: (params: { template: FlowTemplate; publish: boolean }) => Promise<SeededFlow>;
  secretTextConnection: (params: { pieceName: string; secret: string }) => Promise<SeededConnection>;
};

type TrackedRecord = { resource: E2eResource; id: string };

type CustomFixtures = {
  session: E2eSession;
  cleanup: Cleanup;
  seed: Seed;
  mailbox: Mailbox;
};
