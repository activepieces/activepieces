import { test as base } from '@playwright/test';
import {
  AuthenticationPage,
  FlowsPage,
  BuilderPage,
} from '../pages';
import { signUp, AuthenticationResponse } from './users';
import { DEFAULT_EMAIL, DEFAULT_PASSWORD } from '../global-setup';

type CustomFixtures = {
  authenticationPage: AuthenticationPage;
  flowsPage: FlowsPage;
  builderPage: BuilderPage;
  authenticatedPage: AuthenticationPage;
  users: {
    apiSignUp: () => Promise<AuthenticationResponse>;
  }
};

export const test = base.extend<CustomFixtures>({
  // Override page fixture to automatically authenticate before each test
  page: async ({ page }, use) => {
    const authPage = new AuthenticationPage(page);
    
    if (process.env.E2E_EMAIL && process.env.E2E_PASSWORD) {
      await authPage.signIn({
        email: process.env.E2E_EMAIL,
        password: process.env.E2E_PASSWORD,
      });
    } else {
      await authPage.signIn({
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
      });
    }
    
    await use(page);
  },

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
