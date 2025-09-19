import { AuthenticationResponse } from '@activepieces/shared';
import { test as base } from '@playwright/test';
import {
  AuthenticationPage,
  FlowsPage,
  BuilderPage,
} from '../pages';
import { signUp } from './users';

type CustomFixtures = {
  authenticationPage: AuthenticationPage;
  flowsPage: FlowsPage;
  builderPage: BuilderPage;
  authenticatedPage: AuthenticationPage;
  users: {
    apiSignUp: () => Promise<AuthenticationResponse>;
  };
};

export const test = base.extend<CustomFixtures>({
  authenticationPage: async ({ page }, use) => {
    await use(new AuthenticationPage(page));
  },

  flowsPage: async ({ page }, use) => {
    await use(new FlowsPage(page));
  },

  builderPage: async ({ page }, use) => {
    await use(new BuilderPage(page));
  },

  authenticatedPage: async ({ page }, use) => {
    await use(new AuthenticationPage(page));
  },

  users: async ({ request, page }, use) => {
    await use({
      apiSignUp: async () => await signUp(request, page),
    });
  },
});

export { expect } from '@playwright/test';
