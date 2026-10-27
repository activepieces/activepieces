import { test as base } from '@playwright/test';
import {
  AuthenticationPage,
  AutomationsPage,
  BuilderPage,
  RunsPage,
} from '../pages';
import { e2eApi, E2eSession } from './api';

export const test = base.extend<CustomFixtures>({
  authenticationPage: async ({ page }, use) => {
    await use(new AuthenticationPage(page));
  },

  automationsPage: async ({ page }, use) => {
    await use(new AutomationsPage(page));
  },

  builderPage: async ({ page }, use) => {
    await use(new BuilderPage(page));
  },

  runsPage: async ({ page }, use) => {
    await use(new RunsPage(page));
  },

  session: async ({}, use) => {
    await use(e2eApi.readSession());
  },

  flowCleanup: async ({ request, session }, use) => {
    const flowIds: string[] = [];
    await use({ track: (flowId) => flowIds.push(flowId) });
    for (const flowId of flowIds) {
      await e2eApi.deleteFlow({ request, session, flowId });
    }
  },
});

export { expect } from '@playwright/test';

type CustomFixtures = {
  authenticationPage: AuthenticationPage;
  automationsPage: AutomationsPage;
  builderPage: BuilderPage;
  runsPage: RunsPage;
  session: E2eSession;
  flowCleanup: { track: (flowId: string) => void };
};
