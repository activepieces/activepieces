import { faker } from '@faker-js/faker';
import { expect, test } from '../../../fixtures/sign-up';
import { InvitationPage } from '../../../pages/invitation.page';
import { SignUpPage } from '../../../pages/sign-up.page';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Sign up', {
  tag: ['@feature:sign-up', '@surface'],
}, () => {
  test('invited person signs up and lands in a project', async ({ page, invitation, cleanup }) => {
    const invitationPage = new InvitationPage(page);
    const signUpPage = new SignUpPage(page);

    await invitationPage.open(invitation.link);
    await invitationPage.accept();
    await signUpPage.expectEmail(invitation.email);
    const { userId } = await signUpPage.signUp(PERSON);
    cleanup.track({ resource: 'users', id: userId });
    await signUpPage.expectSignedInAs(invitation.email);

    await page.reload();
    await signUpPage.expectSignedInAs(invitation.email);
    await page.close();
  });

  test('uninvited email sees sign up is restricted', async ({ page, cleanup }) => {
    const signUpPage = new SignUpPage(page);
    const email = faker.internet.email({ provider: 'example.com' }).toLowerCase();

    await signUpPage.openAs(email);
    await signUpPage.expectEmail(email);
    const attempt = await signUpPage.attemptSignUp({ person: PERSON, onCreated: (id) => cleanup.track({ resource: 'users', id }) });
    expect(attempt.userId, 'A sign-up without an invitation created a user').toBeUndefined();
    await signUpPage.expectRestricted();
  });
});

const PERSON = { firstName: 'Ada', lastName: 'Lovelace', password: 'E2e-Sign-Up-Pass-1' };
