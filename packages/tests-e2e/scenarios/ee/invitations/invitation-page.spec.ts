import { faker } from '@faker-js/faker';
import { expect, test } from '../../../fixtures';
import { e2eApi } from '../../../fixtures/api';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Invitation page', () => {
  test('invitation link shows a page and accepts on click', async ({ page, request, session, mailbox, invitationPage, invitationCleanup }) => {
    const email = faker.internet.email({ provider: 'example.com' }).toLowerCase();
    const invitation = await e2eApi.invitePlatformMember({ request, session, email });
    invitationCleanup.track(invitation.id);
    const link = await mailbox.linkTo({ to: email, path: '/invitation' });

    await invitationPage.open(link);
    await invitationPage.expectInvitedAs(email);
    expect(await e2eApi.readInvitationStatus({ request, link })).toBe('PENDING');

    await invitationPage.accept();
    await page.waitForURL((url) => url.pathname === '/sign-in' && url.searchParams.get('email') === email);
    expect(await e2eApi.readInvitationStatus({ request, link })).toBe('ACCEPTED');
  });

  test('dead invitation link shows that it no longer works', async ({ request, session, mailbox, invitationPage }) => {
    const email = faker.internet.email({ provider: 'example.com' }).toLowerCase();
    const invitation = await e2eApi.invitePlatformMember({ request, session, email });
    const link = await mailbox.linkTo({ to: email, path: '/invitation' });
    await e2eApi.deleteInvitation({ request, session, invitationId: invitation.id });

    await invitationPage.open(link);
    await invitationPage.expectDeadLink();
  });
});
