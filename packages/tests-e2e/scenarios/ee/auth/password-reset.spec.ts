import { randomUUID } from 'node:crypto';
import { expect, test } from '../../../fixtures';
import { e2eApi } from '../../../fixtures/api';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Password reset', () => {
  test('a user resets a forgotten password from the mail and signs in with the new one', async ({
    request,
    session,
    mailbox,
    userCleanup,
    passwordResetPage,
    authenticationPage,
  }) => {
    const email = `e2e-reset-${randomUUID().slice(0, 8)}@example.com`;
    const oldPassword = 'E2e-Old-Pass-1!';
    const newPassword = 'E2e-New-Pass-2!';

    await e2eApi.invitePlatformMember({ request, session, email });
    await e2eApi.acceptInvitation({ request, link: await mailbox.linkTo({ to: email, path: '/invitation' }) });
    const { userId } = await e2eApi.signUp({ request, email, password: oldPassword });
    userCleanup.track(userId);

    await passwordResetPage.requestLink({ email });
    const resetLink = await mailbox.linkTo({ to: email, path: '/reset-password' });
    await passwordResetPage.setNewPassword({ link: resetLink, password: newPassword });

    await authenticationPage.signIn({ email, password: newPassword });
    await authenticationPage.waitForSignedIn();
    const oldPasswordSignIn = await e2eApi.signIn({ request, email, password: oldPassword });
    expect(oldPasswordSignIn.status()).toBe(401);
  });
});
