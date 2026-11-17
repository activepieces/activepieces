import { expect, test } from '../../fixtures';
import { DEFAULT_EMAIL, DEFAULT_PASSWORD } from '../../global-setup';
import { AuthenticationPage } from '../../pages/authentication.page';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Sign in', () => {
  test('signs in with email and password', async ({ page }) => {
    const authenticationPage = new AuthenticationPage(page);
    const email = process.env.E2E_EMAIL ?? DEFAULT_EMAIL;
    await authenticationPage.signIn({ email, password: process.env.E2E_PASSWORD ?? DEFAULT_PASSWORD });
    await authenticationPage.waitForSignedIn();
    await expect(page.getByRole('button', { name: email })).toBeVisible();
  });
});
