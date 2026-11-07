import { faker } from '@faker-js/faker';
import { expect, test } from '../../../fixtures';
import { e2eApi } from '../../../fixtures/api';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Invitation page', () => {
  test('invitation link shows a page and accepts on click', async ({ page, request, session, invitationPage, invitationCleanup }) => {
    const email = faker.internet.email({ provider: 'example.com' }).toLowerCase();
    const invitation = await e2eApi.createPlatformInvitation({ request, session, email });
    invitationCleanup.track(invitation.id);

    await invitationPage.open(invitation.link);
    await invitationPage.expectInvitedAs(email);
    expect(await e2eApi.readInvitationStatus({ request, link: invitation.link })).toBe('PENDING');

    await invitationPage.accept();
    await page.waitForURL((url) => url.pathname === '/sign-up' && url.searchParams.get('email') === email);
    expect(await e2eApi.readInvitationStatus({ request, link: invitation.link })).toBe('ACCEPTED');
  });

  test('dead invitation link shows that it no longer works', async ({ request, session, invitationPage }) => {
    const email = faker.internet.email({ provider: 'example.com' }).toLowerCase();
    const invitation = await e2eApi.createPlatformInvitation({ request, session, email });
    await e2eApi.deleteInvitation({ request, session, invitationId: invitation.id });

    await invitationPage.open(invitation.link);
    await invitationPage.expectDeadLink();
  });
});
