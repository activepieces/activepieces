import { expect, test } from '../../fixtures';
import { DEFAULT_EMAIL, DEFAULT_PASSWORD } from '../../global-setup';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Sign in', () => {
  test('signs in with email and password', async ({ page, authenticationPage }) => {
    const email = process.env.E2E_EMAIL ?? DEFAULT_EMAIL;
    await authenticationPage.signIn({ email, password: process.env.E2E_PASSWORD ?? DEFAULT_PASSWORD });
    await authenticationPage.waitForSignedIn();
    await expect(page.getByRole('button', { name: email })).toBeVisible();
  });
});
