import { test as base } from '@playwright/test';
import {
  AiProvidersPage,
  AuthenticationPage,
  AutomationsPage,
  BuilderPage,
  InvitationPage,
  PasswordResetPage,
  PlatformSwitcherPage,
  RunsPage,
} from '../pages';
import { e2eApi, E2eSession } from './api';
import { e2eMail, Mailbox } from './mail';

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

  invitationPage: async ({ page }, use) => {
    await use(new InvitationPage(page));
  },

  runsPage: async ({ page }, use) => {
    await use(new RunsPage(page));
  },

  passwordResetPage: async ({ page }, use) => {
    await use(new PasswordResetPage(page));
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

  invitationCleanup: async ({ request, session }, use) => {
    const invitationIds: string[] = [];
    await use({ track: (invitationId) => invitationIds.push(invitationId) });
    for (const invitationId of invitationIds) {
      await e2eApi.deleteInvitation({ request, session, invitationId });
    }
  },

  userCleanup: async ({ request, session }, use) => {
    const userIds: string[] = [];
    await use({ track: (userId) => userIds.push(userId) });
    for (const userId of userIds) {
      await e2eApi.deleteUser({ request, session, userId });
    }
  },

  mailbox: async ({ request }, use) => {
    await use(e2eMail.connect({ request }));
  },
});

export { expect } from '@playwright/test';

type CustomFixtures = {
  aiProvidersPage: AiProvidersPage;
  authenticationPage: AuthenticationPage;
  automationsPage: AutomationsPage;
  builderPage: BuilderPage;
  invitationPage: InvitationPage;
  runsPage: RunsPage;
  passwordResetPage: PasswordResetPage;
  platformSwitcherPage: PlatformSwitcherPage;
  session: E2eSession;
  flowCleanup: { track: (flowId: string) => void };
  connectionCleanup: { track: (connectionId: string) => void };
  aiProviderCleanup: { track: (providerId: string) => void };
  invitationCleanup: { track: (invitationId: string) => void };
  userCleanup: { track: (userId: string) => void };
  mailbox: Mailbox;
};
