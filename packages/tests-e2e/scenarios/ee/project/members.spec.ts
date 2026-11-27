import { randomUUID } from 'node:crypto';
import { e2eApi } from '../../../fixtures/api';
import { expect, test } from '../../../fixtures/access';
import { MembersPage } from '../../../pages/members.page';

test.describe('Settings › members', { tag: ['@feature:members', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('invite a member with a role, change the role and remove the member; an invalid email and a viewer are refused', async ({ page, request, secondProject, viewer, mailbox, cleanup }) => {
    const membersPath = `/api/v1/project-members?projectId=${secondProject.id}`;
    const email = newEmail('e2e-member');
    const membersPage = new MembersPage(page);
    const invitesSent = membersPage.countInviteRequests();

    await test.step('a viewer cannot invite a member: the server refuses', async () => {
      expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path: membersPath }), 'The viewer cannot read the members of its own project').toBe(200);
      expect(await e2eApi.callApiStatus({
        request,
        session: viewer.session,
        method: 'POST',
        path: '/api/v1/user-invitations',
        data: { type: 'PROJECT', email: newEmail('e2e-refused'), projectId: secondProject.id, projectRole: 'Viewer' },
      })).toBe(403);
    });

    await test.step('an invalid email shows an error', async () => {
      await membersPage.open({ projectId: secondProject.id });
      await membersPage.startInvite();
      await membersPage.enterEmail('not-an-email');
      await membersPage.submitInvite();
      await membersPage.expectInviteError('Fix invalid email not-an-email');
      expect(invitesSent()).toBe(0);
    });

    await test.step('invite a member with a role and change the role', async () => {
      await membersPage.removeLastEmail();
      const invitation = await membersPage.invite({ email, role: 'Viewer' });
      cleanup.track({ resource: 'user-invitations', id: invitation.id });
      expect(invitesSent(), 'The invalid email also sent an invite request').toBe(1);
      await expect(membersPage.row(email)).toBeVisible();

      await e2eApi.acceptInvitation({ request, link: await mailbox.linkTo({ to: email, path: '/invitation' }) });
      const { userId } = await e2eApi.signUp({ request, email, password: MEMBER_PASSWORD });
      cleanup.track({ resource: 'users', id: userId });

      await membersPage.open({ projectId: secondProject.id });
      await expect(membersPage.roleOf(email)).toHaveText('Viewer');
      await membersPage.changeRole({ email, role: 'Editor' });

      await membersPage.open({ projectId: secondProject.id });
      await expect(membersPage.roleOf(email)).toHaveText('Editor');
      const members = await e2eApi.callApi<{ data: { user: { email: string }; projectRole: { name: string } }[] }>({
        request,
        session: secondProject.session,
        method: 'GET',
        path: '/api/v1/project-members',
        params: { projectId: secondProject.id, limit: '100' },
      });
      expect(members.data.filter((member) => member.user.email === email).map((member) => member.projectRole.name)).toEqual(['Editor']);
    });

    await test.step('remove a member and the member loses access', async () => {
      const signIn = await e2eApi.signIn({ request, email, password: MEMBER_PASSWORD });
      expect(signIn.status(), 'The invited member cannot sign in').toBe(200);
      const { token }: { token: string } = await signIn.json();
      const memberSession = { token, projectId: secondProject.id };
      expect(await e2eApi.callApiStatus({ request, session: memberSession, method: 'GET', path: membersPath }), 'The member cannot read the members of its project').toBe(200);

      await membersPage.removeMember(email);
      await membersPage.open({ projectId: secondProject.id });
      await expect(membersPage.row(viewer.email), 'The members list did not load').toBeVisible();
      await expect(membersPage.row(email)).toBeHidden();
      expect(await e2eApi.callApiStatus({ request, session: memberSession, method: 'GET', path: membersPath })).toBe(403);
    });
  });
});

function newEmail(label: string): string {
  return `${label}-${randomUUID().slice(0, 8)}@example.com`;
}

const MEMBER_PASSWORD = 'E2e-Member-Pass-1!';
