import { expect, test } from '../../fixtures';
import { DEFAULT_EMAIL, DEFAULT_PASSWORD } from '../../global-setup';
import { AuthenticationPage } from '../../pages/authentication.page';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Sign in', { tag: ['@feature:sign-in', '@surface'] }, () => {
  test('signs in with email and password', async ({ page }) => {
    const authenticationPage = new AuthenticationPage(page);
    const email = process.env.E2E_EMAIL ?? DEFAULT_EMAIL;
    await authenticationPage.signIn({ email, password: process.env.E2E_PASSWORD ?? DEFAULT_PASSWORD });
    await authenticationPage.waitForSignedIn();
    await expect(page.getByRole('button', { name: email })).toBeVisible();
  });

  test('a wrong password shows an error and opens no session', async ({ page }) => {
    const authenticationPage = new AuthenticationPage(page);
    const email = process.env.E2E_EMAIL ?? DEFAULT_EMAIL;

    const status = await authenticationPage.signInStatus({ email, password: WRONG_PASSWORD });

    expect(status).toBe(401);
    await expect(authenticationPage.signInError()).toHaveText('Invalid email or password');
    await expect(page).toHaveURL((url) => url.pathname === authenticationPage.url);
    expect(await authenticationPage.storedToken()).toBeNull();
  });
});

const WRONG_PASSWORD = 'E2e-Wrong-Pass-1!';
