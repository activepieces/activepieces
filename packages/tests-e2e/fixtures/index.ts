import { test as base } from '@playwright/test';
import {
  AiProvidersPage,
  AuthenticationPage,
  AutomationsPage,
  BuilderPage,
  PlatformSwitcherPage,
  RunsPage,
} from '../pages';
import { e2eApi, E2eSession } from './api';

export const test = base.extend<CustomFixtures>({
  aiProvidersPage: async ({ page }, use) => {
    await use(new AiProvidersPage(page));
  },

  authenticationPage: async ({ page }, use) => {
    await use(new AuthenticationPage(page));
  },

  automationsPage: async ({ page }, use) => {
    await use(new AutomationsPage(page));
  },

  builderPage: async ({ page, request, session }, use) => {
    await use(new BuilderPage({ page, describeRun: (runId) => e2eApi.describeRun({ request, session, runId }) }));
  },

  runsPage: async ({ page }, use) => {
    await use(new RunsPage(page));
  },

  platformSwitcherPage: async ({ page }, use) => {
    await use(new PlatformSwitcherPage(page));
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

  connectionCleanup: async ({ request, session }, use) => {
    const connectionIds: string[] = [];
    await use({ track: (connectionId) => connectionIds.push(connectionId) });
    for (const connectionId of connectionIds) {
      await e2eApi.deleteConnection({ request, session, connectionId });
    }
  },

  aiProviderCleanup: async ({ request, session }, use) => {
    const providerIds: string[] = [];
    await use({ track: (providerId) => providerIds.push(providerId) });
    for (const providerId of providerIds) {
      await e2eApi.deleteAiProvider({ request, session, providerId });
    }
  },
});

export { expect } from '@playwright/test';

type CustomFixtures = {
  aiProvidersPage: AiProvidersPage;
  authenticationPage: AuthenticationPage;
  automationsPage: AutomationsPage;
  builderPage: BuilderPage;
  runsPage: RunsPage;
  platformSwitcherPage: PlatformSwitcherPage;
  session: E2eSession;
  flowCleanup: { track: (flowId: string) => void };
  connectionCleanup: { track: (connectionId: string) => void };
  aiProviderCleanup: { track: (providerId: string) => void };
};
