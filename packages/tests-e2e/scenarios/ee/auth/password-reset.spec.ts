import { randomUUID } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';
import { Cleanup, expect, test } from '../../../fixtures';
import { e2eApi, E2eSession } from '../../../fixtures/api';
import { Mailbox } from '../../../fixtures/mail';
import { AuthenticationPage } from '../../../pages/authentication.page';
import { PasswordResetPage } from '../../../pages/password-reset.page';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Password reset', { tag: ['@feature:password', '@surface'] }, () => {
  test('a user resets a forgotten password from the mail and signs in with the new one', async ({ page, request, session, mailbox, cleanup }) => {
    const passwordResetPage = new PasswordResetPage(page);
    const authenticationPage = new AuthenticationPage(page);
    const email = await createMember({ request, session, mailbox, cleanup, password: OLD_PASSWORD });

    await passwordResetPage.requestLink({ email });
    const resetLink = await mailbox.linkTo({ to: email, path: '/reset-password' });
    await passwordResetPage.setNewPassword({ link: resetLink, password: NEW_PASSWORD });

    await authenticationPage.signIn({ email, password: NEW_PASSWORD });
    await authenticationPage.waitForSignedIn();
    const oldPasswordSignIn = await e2eApi.signIn({ request, email, password: OLD_PASSWORD });
    expect(oldPasswordSignIn.status()).toBe(401);
    await page.close();
  });

  test('a new password that is too short shows an error, and the server refuses it', async ({ page, request, session, mailbox, cleanup }) => {
    const passwordResetPage = new PasswordResetPage(page);
    const email = await createMember({ request, session, mailbox, cleanup, password: OLD_PASSWORD });
    await passwordResetPage.requestLink({ email });
    const resetLink = await mailbox.linkTo({ to: email, path: '/reset-password' });

    await passwordResetPage.submitNewPassword({ link: resetLink, password: SHORT_PASSWORD });

    await expect(passwordResetPage.newPasswordError()).toHaveText('Password must be at least 8 characters long');
    await expect(page).toHaveURL((url) => url.pathname === '/reset-password');

    const refused = await request.post('/api/v1/authn/local/reset-password', {
      data: { identityId: resetLink.searchParams.get('identityId'), otp: resetLink.searchParams.get('otpcode'), newPassword: SHORT_PASSWORD },
    });
    expect(refused.status()).toBe(400);
    const oldPasswordSignIn = await e2eApi.signIn({ request, email, password: OLD_PASSWORD });
    expect(oldPasswordSignIn.status(), 'The old password still works').toBe(200);
  });
});

async function createMember({ request, session, mailbox, cleanup, password }: {
  request: APIRequestContext;
  session: E2eSession;
  mailbox: Mailbox;
  cleanup: Cleanup;
  password: string;
}): Promise<string> {
  const email = `e2e-reset-${randomUUID().slice(0, 8)}@example.com`;
  await e2eApi.invitePlatformMember({ request, session, email });
  await e2eApi.acceptInvitation({ request, link: await mailbox.linkTo({ to: email, path: '/invitation' }) });
  const { userId } = await e2eApi.signUp({ request, email, password });
  cleanup.track({ resource: 'users', id: userId });
  return email;
}

const OLD_PASSWORD = 'E2e-Old-Pass-1!';
const NEW_PASSWORD = 'E2e-New-Pass-2!';
const SHORT_PASSWORD = 'E2e-1!a';
