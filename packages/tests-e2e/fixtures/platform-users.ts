import { randomUUID } from 'node:crypto';
import { e2eApi } from './api';
import { test as base } from './index';

export const test = base.extend<{ member: PlatformMember }>({
  member: async ({ request, session, mailbox, cleanup }, use) => {
    const email = `e2e-member-${randomUUID().slice(0, 8)}@example.com`;
    const invitation = await e2eApi.invitePlatformMember({ request, session, email });
    cleanup.track({ resource: 'user-invitations', id: invitation.id });
    await e2eApi.acceptInvitation({ request, link: await mailbox.linkTo({ to: email, path: '/invitation' }) });
    const { userId } = await e2eApi.signUp({ request, email, password: MEMBER_PASSWORD });
    cleanup.track({ resource: 'users', id: userId });
    const signIn = await e2eApi.signIn({ request, email, password: MEMBER_PASSWORD });
    if (!signIn.ok()) {
      throw new Error(`Signing in the member failed with ${signIn.status()}: ${await signIn.text()}`);
    }
    const { token }: { token: string } = await signIn.json();
    await use({
      userId,
      email,
      password: MEMBER_PASSWORD,
      readOwnUserStatus: async () => {
        const response = await request.get(`/api/v1/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        return response.status();
      },
    });
  },
});

export { expect } from '@playwright/test';

const MEMBER_PASSWORD = 'E2e-Member-Pass-1!';

type PlatformMember = {
  userId: string;
  email: string;
  password: string;
  readOwnUserStatus: () => Promise<number>;
};
