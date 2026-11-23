import { mergeTests } from '@playwright/test';
import { expect, test as accessTest } from '../../../fixtures/access';
import { e2eApi } from '../../../fixtures/api';
import { test as listResponseTest } from '../../../fixtures/list-response';
import { test as platformUsersTest } from '../../../fixtures/platform-users';
import { MembersPage } from '../../../pages/members.page';
import { PlatformUsersPage, ProjectRolesPage } from '../../../pages/platform-users.page';

const test = mergeTests(accessTest, platformUsersTest, listResponseTest);

test.describe('Users and project roles', { tag: ['@feature:users', '@surface'] }, () => {
  test.describe.configure({ timeout: 120_000 });

  test('deactivate a user and the user cannot sign in', async ({ page, request, viewer, member }) => {
    const memberPath = `/api/v1/users/${member.userId}`;

    await test.step('a viewer cannot deactivate the user: the server refuses', async () => {
      expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path: memberPath }), 'The viewer cannot read a user of its platform').toBe(200);
      expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'POST', path: memberPath, data: { status: 'INACTIVE' } })).toBe(403);
      expect(await member.readOwnUserStatus(), 'The session of the user ended before the deactivation').toBe(200);
    });

    await test.step('the admin deactivates the user', async () => {
      const usersPage = new PlatformUsersPage(page);
      await usersPage.open();
      await usersPage.deactivate({ email: member.email, userId: member.userId });
    });

    await test.step('the server refuses the sign-in and the open session of the user', async () => {
      const signIn = await e2eApi.signIn({ request, email: member.email, password: member.password });
      expect(signIn.status()).toBe(403);
      const refusal: { code: string } = await signIn.json();
      expect(refusal.code).toBe('USER_IS_INACTIVE');
      expect(await member.readOwnUserStatus()).toBe(403);
    });
  });

  test('create a custom project role and give it to a member', async ({ page, request, secondProject, viewer, cleanup }) => {
    const roleName = e2eApi.uniqueName('role');
    const newFolder = () => ({ displayName: e2eApi.uniqueName('folder'), projectId: secondProject.id });
    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'POST', path: '/api/v1/folders', data: newFolder() }), 'The Viewer role can already create a folder').toBe(403);

    await test.step('create a role based on Editor', async () => {
      const rolesPage = new ProjectRolesPage(page);
      await rolesPage.open();
      await rolesPage.openCreateDialog();
      await rolesPage.chooseBase('Editor');
      const role = await rolesPage.create(roleName);
      cleanup.track({ resource: 'project-roles', id: encodeURIComponent(role.name) });
      await expect(rolesPage.role(roleName)).toBeVisible();
    });

    await test.step('give the role to a member of a project', async () => {
      const membersPage = new MembersPage(page);
      await membersPage.open({ projectId: secondProject.id });
      await membersPage.changeRole({ email: viewer.email, role: roleName });
      const members = await e2eApi.callApi<{ data: { user: { email: string }; projectRole: { name: string } }[] }>({
        request,
        session: secondProject.session,
        method: 'GET',
        path: '/api/v1/project-members',
        params: { projectId: secondProject.id, limit: '100' },
      });
      expect(members.data.filter((projectMember) => projectMember.user.email === viewer.email).map((projectMember) => projectMember.projectRole.name)).toEqual([roleName]);
    });

    await test.step('the member gets the permissions of the role', async () => {
      const folder = await e2eApi.callApi<{ id: string }>({ request, session: viewer.session, method: 'POST', path: '/api/v1/folders', data: newFolder() });
      cleanup.track({ resource: 'folders', id: folder.id });
    });
  });

  test('a role with no name or a taken name is not created', async ({ page, request, session, cleanup }) => {
    const rolesPage = new ProjectRolesPage(page);
    await rolesPage.open();
    const roleCreates = rolesPage.countRoleCreates();
    await rolesPage.openCreateDialog();

    await expect(rolesPage.createButton()).toBeDisabled();
    await rolesPage.enterName('   ');
    await expect(rolesPage.createButton()).toBeDisabled();
    expect(roleCreates()).toBe(0);

    await rolesPage.submitTakenName('Editor');
    await expect(rolesPage.saveError()).toHaveText('A role called Editor already exists on this platform. Pick another name.');
    const roles = await e2eApi.callApi<{ data: { name: string }[] }>({ request, session, method: 'GET', path: '/api/v1/project-roles' });
    expect(roles.data.filter((role) => role.name.toLowerCase() === 'editor')).toHaveLength(1);

    const name = e2eApi.uniqueName('role');
    const role = await rolesPage.create(name);
    cleanup.track({ resource: 'project-roles', id: encodeURIComponent(role.name) });
    await expect(rolesPage.role(name)).toBeVisible();
    expect(roleCreates()).toBe(2);
  });

  test('a users list with no rows shows the empty state', async ({ page, listResponse }) => {
    await listResponse.empty({ resource: 'users' });
    await listResponse.empty({ resource: 'user-invitations' });
    const usersPage = new PlatformUsersPage(page);

    await usersPage.visit();

    await expect(usersPage.emptyState()).toContainText('No users found');
  });

  test('a failed users request shows the error state', async ({ page, listResponse }) => {
    const restore = await listResponse.fail({ resource: 'users' });
    await listResponse.empty({ resource: 'user-invitations' });
    const usersPage = new PlatformUsersPage(page);

    await usersPage.visit();

    await expect(usersPage.errorState()).toBeVisible({ timeout: listResponse.ERROR_STATE_TIMEOUT_MS });
    await restore();
    await usersPage.expectRetrySucceeds();
  });

  test('a viewer cannot list platform users', async ({ request, session, viewer }) => {
    const ownFlows = `/api/v1/flows?projectId=${viewer.session.projectId}&limit=1`;
    const users = '/api/v1/users?limit=1';

    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path: ownFlows }), 'The viewer cannot read the flows of its own project').toBe(200);
    expect(await e2eApi.callApiStatus({ request, session: viewer.session, method: 'GET', path: users })).toBe(403);
    expect(await e2eApi.callApiStatus({ request, session, method: 'GET', path: users })).toBe(200);
  });
});
